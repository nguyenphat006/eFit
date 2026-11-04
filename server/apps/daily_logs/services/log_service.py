"""
Nghiệp vụ ghi nhật ký hằng ngày:
- Xác định chủ sở hữu (owner) / học viên (client) / giai đoạn (phase) của một ngày.
- Gắn giai đoạn tự động theo ngày từ mùa giải ĐANG CHẠY + chụp lại mục tiêu macro.
- Cộng macro thực nạp từ các bữa đã hoàn thành trong thực đơn của giai đoạn.
- Tính điểm kỷ luật.
"""
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.utils.translation import gettext as _
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.core.ownership import is_data_admin
from apps.seasons.models import NutritionPlan, Phase, SeasonStatus

from ..models import DailyLog
from .metrics import calculate_compliance

ZERO = Decimal('0')


def find_active_phase(owner, client, log_date):
    """Giai đoạn chứa `log_date` của mùa giải ACTIVE (không phải mẫu) thuộc owner / học viên."""
    qs = Phase.objects.filter(
        season__owner=owner,
        season__status=SeasonStatus.ACTIVE,
        season__is_template=False,
        season__deleted_at__isnull=True,
        start_date__lte=log_date,
        end_date__gte=log_date,
    )
    qs = qs.filter(season__client=client) if client else qs.filter(season__client__isnull=True)
    return qs.order_by('sort_order', 'id').first()


def get_accessible_phase(user, phase_id):
    """Giai đoạn mà user được ghi nhật ký (chủ mùa giải hoặc ADMIN); không thấy -> 404."""
    qs = Phase.objects.select_related('season').filter(season__deleted_at__isnull=True)
    if not is_data_admin(user):
        qs = qs.filter(season__owner=user)
    phase = qs.filter(pk=phase_id).first()
    if phase is None:
        raise NotFound(_("Không tìm thấy giai đoạn."))
    return phase


def check_client_access(user, client):
    """HLV chỉ ghi nhật ký cho học viên của mình (ADMIN ghi được cho mọi học viên)."""
    if client is not None and not is_data_admin(user) and client.coach_id != user.id:
        raise ValidationError({'client': [_("Học viên không thuộc quyền quản lý của bạn.")]})


def resolve_scope(user, client=None, phase=None, log_date=None):
    """Trả (owner, client, phase) cho một nhật ký; phase có sẵn thì owner / client lấy theo mùa giải."""
    if phase is not None:
        phase = get_accessible_phase(user, phase.pk)
        if log_date and not (phase.start_date <= log_date <= phase.end_date):
            raise ValidationError({'log_date': [_("Ngày ghi nằm ngoài khoảng ngày của giai đoạn.")]})
        return phase.season.owner, phase.season.client, phase
    check_client_access(user, client)
    owner = client.coach if client is not None else user
    return owner, client, find_active_phase(owner, client, log_date) if log_date else None


def apply_snapshot(log, phase):
    """Chụp mục tiêu macro của giai đoạn vào nhật ký (chỉ khi chưa có snapshot)."""
    if phase is None or log.target_calories_snapshot is not None:
        return
    log.target_calories_snapshot = phase.target_calories
    log.target_protein_snapshot = phase.target_protein
    log.target_carbs_snapshot = phase.target_carbs
    log.target_fat_snapshot = phase.target_fat


def apply_completed_meals(log):
    """Có danh sách bữa đã ăn -> cộng macro thực nạp theo mục tiêu của từng bữa trong thực đơn giai đoạn."""
    meal_ids = log.diet_completed_meal_ids
    if meal_ids is None:
        return
    plan = NutritionPlan.objects.filter(phase_id=log.phase_id).prefetch_related('meals').first() if log.phase_id else None
    if plan is None:
        log.diet_meals_completed = len(meal_ids)
        return
    meals = {m.id: m for m in plan.meals.all()}
    chosen = [meals[i] for i in meal_ids if i in meals]
    log.calories_in = sum((m.target_calories for m in chosen), ZERO)
    log.protein_in = sum((m.target_protein for m in chosen), ZERO)
    log.carbs_in = sum((m.target_carbs for m in chosen), ZERO)
    log.fat_in = sum((m.target_fat for m in chosen), ZERO)
    log.diet_meals_completed = len(chosen)
    log.diet_target_meals = len(meals) or log.diet_target_meals


def finalize(log):
    """Tính lại các trường suy ra trước khi lưu."""
    apply_snapshot(log, log.phase)
    apply_completed_meals(log)
    log.compliance_score = calculate_compliance(log)


def find_existing(owner, client, log_date):
    qs = DailyLog.objects.filter(log_date=log_date)
    return qs.filter(client=client).first() if client else qs.filter(owner=owner, client__isnull=True).first()


def upsert_log(user, data: dict, perms: set | None = None):
    """
    Tạo hoặc cập nhật nhật ký của 1 ngày (khóa: học viên + ngày, hoặc owner + ngày khi không có học viên).
    `data` là validated_data của serializer ghi (chỉ các trường gửi lên). `perms` có giá trị -> tạo mới cần
    quyền CREATE, sửa cần UPDATE. Trả (log, created).
    """
    data = dict(data)
    log_date = data.pop('log_date')
    owner, client, phase = resolve_scope(user, data.pop('client', None), data.pop('phase', None), log_date)

    with transaction.atomic():
        log = find_existing(owner, client, log_date)
        created = log is None
        if perms is not None:
            check_user_can(user, perms, 'DAILY_LOG_CREATE' if created else 'DAILY_LOG_UPDATE')
        if created:
            log = DailyLog(owner=owner, client=client, phase=phase, log_date=log_date, created_by=user)
        elif phase is not None and log.phase_id is None:
            log.phase = phase
        for field, value in data.items():
            setattr(log, field, value)
        log.updated_by = user
        finalize(log)
        try:
            log.save()
        except IntegrityError:
            raise ValidationError({'log_date': [_("Ngày này đã có nhật ký.")]})
    return log, created


def check_user_can(user, perms: set, code: str):
    if not ('*' in perms or code in perms or user.is_superuser):
        raise PermissionDenied()
