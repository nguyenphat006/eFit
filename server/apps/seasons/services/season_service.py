"""
Nghiệp vụ mùa giải: máy trạng thái, quy tắc "mỗi (owner, học viên) chỉ 1 mùa ACTIVE",
tạo mùa kèm Phase 1, giao mùa mẫu cho học viên (dời ngày + clone giáo án), kiểm tra ngày của giai đoạn.
"""
from datetime import timedelta

from django.db import transaction
from django.utils.translation import gettext as _
from rest_framework.exceptions import ValidationError

from apps.core.exceptions import BusinessError
from apps.workouts.services.program_service import clone_program, snapshot_program

from ..models import Phase, Season, SeasonStatus

# Trạng thái được phép chuyển tới từ mỗi trạng thái
ALLOWED_TRANSITIONS = {
    SeasonStatus.DRAFT: {SeasonStatus.ACTIVE, SeasonStatus.ABANDONED},
    SeasonStatus.ACTIVE: {SeasonStatus.COMPLETED, SeasonStatus.ABANDONED},
    SeasonStatus.COMPLETED: set(),
    SeasonStatus.ABANDONED: set(),
}
DELETABLE_STATUSES = {SeasonStatus.DRAFT, SeasonStatus.ABANDONED}


def complete_other_active(season: Season, user=None):
    """Đóng (COMPLETED) mọi mùa ACTIVE khác cùng owner + cùng học viên (client trống khớp client trống)."""
    qs = Season.objects.filter(owner_id=season.owner_id, client_id=season.client_id, status=SeasonStatus.ACTIVE)
    if season.pk:
        qs = qs.exclude(pk=season.pk)
    for other in qs.select_for_update():
        other.status = SeasonStatus.COMPLETED
        other.updated_by = user or other.updated_by
        other.save(update_fields=['status', 'updated_by', 'updated_at'])


def change_status(season: Season, new_status: str, user=None) -> Season:
    """Chuyển trạng thái theo máy trạng thái; DRAFT -> ACTIVE cần ≥ 1 giai đoạn và đóng mùa ACTIVE cũ."""
    if new_status not in SeasonStatus.values:
        raise ValidationError({'status': [_("Trạng thái không hợp lệ.")]})
    if new_status not in ALLOWED_TRANSITIONS.get(season.status, set()):
        raise BusinessError(
            _("Không thể chuyển mùa giải từ '%(old)s' sang '%(new)s'.") % {
                'old': SeasonStatus(season.status).label, 'new': SeasonStatus(new_status).label,
            }
        )
    if new_status == SeasonStatus.ACTIVE:
        if season.is_template:
            raise BusinessError(_("Mùa giải mẫu không thể kích hoạt. Hãy giao mẫu cho học viên trước."))
        if not season.phases.exists():
            raise BusinessError(_("Mùa giải phải có ít nhất 1 giai đoạn trước khi kích hoạt."))
    with transaction.atomic():
        if new_status == SeasonStatus.ACTIVE:
            complete_other_active(season, user)
        season.status = new_status
        season.updated_by = user or season.updated_by
        season.save(update_fields=['status', 'updated_by', 'updated_at'])
    return season


def create_default_phase(season: Season, user=None, workout_template=None) -> Phase:
    """Phase 1 phủ toàn bộ mùa giải; có giáo án mẫu thì clone sang owner và gán kèm snapshot."""
    program = None
    if workout_template is not None:
        program = clone_program(
            workout_template, owner=season.owner, user=user, client=season.client, is_template=False,
        )
    return Phase.objects.create(
        season=season,
        name='Phase 1',
        sort_order=1,
        start_date=season.start_date,
        end_date=season.end_date,
        workout_program=program,
        workout_program_snapshot=snapshot_program(program) if program else None,
        created_by=user,
        updated_by=user,
    )


def validate_phase_dates(season: Season, start_date, end_date, exclude_id=None):
    """Giai đoạn phải nằm trong mùa giải và không chồng lấn giai đoạn khác."""
    errors = {}
    if start_date and end_date and end_date < start_date:
        errors['end_date'] = [_("Ngày kết thúc phải sau ngày bắt đầu.")]
    elif start_date < season.start_date or end_date > season.end_date:
        errors['start_date'] = [
            _("Giai đoạn phải nằm trong thời gian mùa giải (%(start)s – %(end)s).") % {
                'start': season.start_date.strftime('%d/%m/%Y'), 'end': season.end_date.strftime('%d/%m/%Y'),
            }
        ]
    else:
        others = season.phases.all()
        if exclude_id:
            others = others.exclude(pk=exclude_id)
        for other in others:
            if start_date <= other.end_date and end_date >= other.start_date:
                errors['start_date'] = [
                    _("Thời gian trùng với giai đoạn '%(name)s' (%(start)s – %(end)s).") % {
                        'name': other.name,
                        'start': other.start_date.strftime('%d/%m/%Y'),
                        'end': other.end_date.strftime('%d/%m/%Y'),
                    }
                ]
                break
    if errors:
        raise ValidationError(errors)


def assign_template(template: Season, *, client, start_date, user, name=None, activate=False) -> Season:
    """
    Giao mùa giải mẫu cho học viên: dời mọi ngày để giai đoạn đầu bắt đầu đúng `start_date`,
    clone giáo án của từng giai đoạn (kèm snapshot) và thực đơn.
    """
    phases = list(template.phases.select_related('workout_program', 'nutrition_plan').order_by('sort_order', 'start_date', 'id'))
    if not phases:
        raise BusinessError(_("Mùa giải mẫu chưa có giai đoạn nào."))
    delta = timedelta(days=(start_date - phases[0].start_date).days)

    with transaction.atomic():
        season = Season.objects.create(
            owner=user,
            client=client,
            name=name or template.name,
            goal_type=template.goal_type,
            start_date=start_date,
            end_date=template.end_date + delta,
            status=SeasonStatus.DRAFT,
            is_template=False,
            source_season=template,
            description=template.description,
            created_by=user,
            updated_by=user,
        )
        for phase in phases:
            program = None
            if phase.workout_program_id:
                program = clone_program(
                    phase.workout_program, owner=user, user=user, client=client,
                    name=f"{phase.workout_program.name} ({season.name})",
                )
            new_phase = Phase.objects.create(
                season=season,
                name=phase.name,
                description=phase.description,
                sort_order=phase.sort_order,
                start_date=phase.start_date + delta,
                end_date=phase.end_date + delta,
                target_calories=phase.target_calories,
                target_protein=phase.target_protein,
                target_carbs=phase.target_carbs,
                target_fat=phase.target_fat,
                workout_program=program,
                workout_program_snapshot=snapshot_program(program) if program else phase.workout_program_snapshot,
                created_by=user,
                updated_by=user,
            )
            plan = getattr(phase, 'nutrition_plan', None)
            if plan is not None:
                from .nutrition_plan_service import copy_plan
                copy_plan(plan, new_phase)
        if activate:
            change_status(season, SeasonStatus.ACTIVE, user)
    return season
