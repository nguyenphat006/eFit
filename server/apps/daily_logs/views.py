from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.translation import gettext as _
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from apps.clients.models import Client
from apps.core.image_upload import IMAGE_UPLOADED, save_uploaded_image
from apps.core.ownership import OwnedQuerysetMixin
from apps.core.permissions import ModulePermissionChecker, get_user_permissions
from apps.core.responses import success_response
from apps.core.viewsets import BaseERPViewSet

from .models import DailyLog
from .serializers import (
    DailyLogCreateUpdateSerializer,
    DailyLogSerializer,
    DailyLogSummarySerializer,
    DailyLogUpsertSerializer,
)
from .services import log_service
from .services.metrics import calculate_dfi

TAG = "Nhật ký hằng ngày"
SUMMARY_DAYS = 7


def _num(value):
    return float(value) if value is not None else None


@extend_schema_view(
    list=extend_schema(tags=[TAG], summary="Danh sách nhật ký (lọc theo khoảng ngày / học viên / giai đoạn)"),
    retrieve=extend_schema(tags=[TAG], summary="Chi tiết nhật ký"),
    create=extend_schema(tags=[TAG], summary="Tạo nhật ký ngày mới"),
    update=extend_schema(tags=[TAG], summary="Cập nhật nhật ký"),
    partial_update=extend_schema(tags=[TAG], summary="Cập nhật một phần nhật ký"),
    destroy=extend_schema(tags=[TAG], summary="Xóa mềm nhật ký"),
)
class DailyLogViewSet(OwnedQuerysetMixin, BaseERPViewSet):
    """
    Nhật ký hằng ngày của người tập / học viên. Người dùng chỉ thấy nhật ký mình sở hữu (ADMIN thấy tất cả).
    Mỗi ngày 1 nhật ký cho mỗi học viên (hoặc cho chính owner khi không có học viên) -> ghi nhanh qua `upsert/`.
    Giai đoạn + mục tiêu macro tự gắn theo mùa giải đang chạy; điểm kỷ luật tự tính lại khi lưu.
    """
    queryset = (
        DailyLog.objects
        .select_related('owner', 'client', 'phase', 'created_by', 'updated_by')
        .order_by('-updated_at', 'id')
    )
    serializer_class = DailyLogSerializer
    write_serializer_class = DailyLogCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, ModulePermissionChecker]
    permission_module = 'DAILY_LOG'
    owner_field = 'owner'
    owner_assign_field = None  # owner do service xác định (học viên -> HLV của học viên)
    custom_action_permissions = {
        'upsert': ['DAILY_LOG_CREATE', 'DAILY_LOG_UPDATE'],
        'upload_image': ['DAILY_LOG_CREATE', 'DAILY_LOG_UPDATE'],
        'summary': 'DAILY_LOG_READ',
    }
    filterset_fields = {
        'log_date': ['exact', 'gte', 'lte'],
        'client': ['exact', 'isnull'],
        'phase': ['exact'],
        'phase__season': ['exact'],
        'is_workout_completed': ['exact'],
        'diet_cheat_status': ['exact', 'in'],
        'updated_at': ['date__gte', 'date__lte'],
    }
    search_fields = ['client__full_name', 'diet_notes', 'compliance_notes', 'description']
    ordering_fields = ['log_date', 'weight', 'compliance_score', 'created_at', 'updated_at']

    def perform_create(self, serializer):
        data = serializer.validated_data
        user = self.request.user
        owner, client, phase = log_service.resolve_scope(user, data.get('client'), data.get('phase'), data['log_date'])
        if log_service.find_existing(owner, client, data['log_date']):
            raise ValidationError({'log_date': [_("Ngày này đã có nhật ký.")]})
        log = DailyLog(owner=owner, client=client, phase=phase, created_by=user, updated_by=user)
        for field, value in data.items():
            if field not in ('client', 'phase'):
                setattr(log, field, value)
        log_service.finalize(log)
        try:
            with transaction.atomic():
                log.save()
        except IntegrityError:
            raise ValidationError({'log_date': [_("Ngày này đã có nhật ký.")]})
        serializer.instance = log

    def perform_update(self, serializer):
        log = serializer.instance
        for field, value in serializer.validated_data.items():
            setattr(log, field, value)
        log.updated_by = self.request.user
        log_service.finalize(log)
        log.save()

    @extend_schema(
        tags=[TAG], summary="Ghi nhanh nhật ký theo ngày (tạo nếu chưa có, cập nhật nếu đã có)",
        request=DailyLogUpsertSerializer, responses=DailyLogSerializer,
    )
    @action(detail=False, methods=['put'], url_path='upsert')
    def upsert(self, request):
        serializer = DailyLogUpsertSerializer(data=request.data, partial=True, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        if 'log_date' not in serializer.validated_data:
            raise ValidationError({'log_date': [_("Vui lòng chọn ngày.")]})
        log, created = log_service.upsert_log(
            request.user, serializer.validated_data, perms=get_user_permissions(request.user)
        )
        return success_response(
            data=DailyLogSerializer(log, context=self.get_serializer_context()).data,
            message=_("Đã lưu nhật ký ngày %(date)s") % {"date": log.log_date.strftime('%d/%m/%Y')},
            status_code=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @extend_schema(
        tags=[TAG], summary="Tóm tắt 7 ngày gần nhất: DFI hôm nay, tỷ lệ ghi nhật ký, điểm kỷ luật",
        parameters=[OpenApiParameter('client', int, description="Học viên (bỏ trống = nhật ký của chính mình)")],
        responses=DailyLogSummarySerializer,
    )
    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        today = timezone.localdate()
        start = today - timedelta(days=SUMMARY_DAYS - 1)
        qs = self.get_queryset().filter(log_date__gte=start, log_date__lte=today)
        client_id = request.query_params.get('client')
        if client_id:
            client = Client.objects.filter(pk=client_id).first()
            log_service.check_client_access(request.user, client)
            qs = qs.filter(client_id=client_id)
        else:
            qs = qs.filter(client__isnull=True, owner=request.user)
        logs = list(qs.order_by('log_date'))

        history = [
            {
                'date': log.log_date, 'weight': _num(log.weight), 'sleep_hours': _num(log.sleep_hours),
                'work_hours': _num(log.work_hours), 'fatigue_level': log.fatigue_level,
                'calories_in': _num(log.calories_in), 'compliance_score': _num(log.compliance_score),
                'dfi': calculate_dfi(log.sleep_hours, log.work_hours, log.fatigue_level),
            }
            for log in logs
        ]
        today_log = next((log for log in logs if log.log_date == today), None)
        scores = [float(log.compliance_score) for log in logs if log.compliance_score is not None]
        data = {
            'today': {
                'date': today,
                'has_log': today_log is not None,
                'dfi': calculate_dfi(today_log.sleep_hours, today_log.work_hours, today_log.fatigue_level) if today_log else None,
                'weight': _num(today_log.weight) if today_log else None,
                'sleep_hours': _num(today_log.sleep_hours) if today_log else None,
                'compliance_score': _num(today_log.compliance_score) if today_log else None,
            },
            'log_adherence_7d': round(len({log.log_date for log in logs}) / SUMMARY_DAYS * 100, 1),
            'compliance_avg_7d': round(sum(scores) / len(scores), 1) if scores else None,
            'history_7d': history,
        }
        return success_response(data=DailyLogSummarySerializer(data).data)

    @extend_schema(tags=[TAG], summary="Tải ảnh check-in (trả URL để gửi kèm body_images)")
    @action(detail=False, methods=['post'], url_path='upload-image')
    def upload_image(self, request):
        data = save_uploaded_image(request, 'daily-logs', prefix='log', max_size_mb=5)
        return success_response(data=data, message=IMAGE_UPLOADED, status_code=status.HTTP_201_CREATED)
