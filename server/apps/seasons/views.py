from django.db import transaction
from django.db.models import Count, Prefetch, Q
from django.utils.translation import gettext as _
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound

from apps.core.exceptions import BusinessError
from apps.core.ownership import OwnedQuerysetMixin
from apps.core.permissions import ModulePermissionChecker
from apps.core.responses import success_response
from apps.core.viewsets import BaseERPViewSet
from apps.daily_logs.models import DailyLog

from .models import Meal, MealItem, NutritionPlan, Phase, Season, SeasonStatus
from .serializers import (
    NutritionPlanGenerateSerializer,
    NutritionPlanInputSerializer,
    NutritionPlanSerializer,
    PhaseCreateUpdateSerializer,
    PhaseDailyLogSerializer,
    PhaseSerializer,
    SeasonAssignSerializer,
    SeasonCreateUpdateSerializer,
    SeasonListSerializer,
    SeasonSerializer,
    SeasonStatusSerializer,
)
from .services import nutrition_plan_service, season_service

TAG = "Mùa giải"
PHASE_TAG = "Giai đoạn mùa giải"

PHASE_PREFETCH = Prefetch(
    'phases',
    queryset=Phase.objects.select_related('workout_program', 'nutrition_plan', 'season').order_by('sort_order', 'start_date', 'id'),
)


@extend_schema_view(
    list=extend_schema(tags=[TAG], summary="Danh sách mùa giải"),
    retrieve=extend_schema(tags=[TAG], summary="Chi tiết mùa giải (kèm giai đoạn)"),
    create=extend_schema(tags=[TAG], summary="Tạo mùa giải (tự sinh Phase 1)"),
    update=extend_schema(tags=[TAG], summary="Cập nhật mùa giải"),
    partial_update=extend_schema(tags=[TAG], summary="Cập nhật một phần mùa giải"),
    destroy=extend_schema(tags=[TAG], summary="Xóa mềm mùa giải (chỉ Nháp / Bỏ dở)"),
)
class SeasonViewSet(OwnedQuerysetMixin, BaseERPViewSet):
    """
    Mùa giải: CRUD + đổi trạng thái (máy trạng thái), mùa đang chạy, giao mùa mẫu cho học viên.
    Mỗi (owner, học viên) chỉ có 1 mùa ACTIVE. Người dùng thường chỉ thấy mùa giải mình sở hữu.
    """
    queryset = (
        Season.objects
        .select_related('created_by', 'updated_by', 'owner', 'client', 'source_season')
        .order_by('-updated_at', 'id')
    )
    serializer_class = SeasonSerializer
    write_serializer_class = SeasonCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, ModulePermissionChecker]
    permission_module = 'SEASON'
    custom_action_permissions = {
        'change_status': 'SEASON_UPDATE',
        'active': 'SEASON_READ',
        'assign': 'SEASON_CREATE',
    }
    owner_field = 'owner'
    filterset_fields = {
        'is_active': ['exact'],
        'is_template': ['exact'],
        'status': ['exact', 'in'],
        'goal_type': ['exact', 'in'],
        'client': ['exact', 'isnull', 'in'],
        'name': ['icontains'],
        'start_date': ['gte', 'lte'],
        'end_date': ['gte', 'lte'],
        'updated_at': ['date__gte', 'date__lte'],
    }
    search_fields = ['name', 'description', 'client__full_name']
    ordering_fields = ['created_at', 'updated_at', 'name', 'start_date', 'end_date', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            return qs.annotate(phase_count=Count('phases', filter=Q(phases__deleted_at__isnull=True), distinct=True))
        return qs.prefetch_related(PHASE_PREFETCH)

    def get_serializer_class(self):
        if self.action == 'list':
            return SeasonListSerializer
        return super().get_serializer_class()

    def serialize_read(self, instance):
        fresh = Season.objects.select_related('owner', 'client', 'source_season', 'created_by', 'updated_by') \
            .prefetch_related(PHASE_PREFETCH).get(pk=instance.pk)
        return SeasonSerializer(fresh, context=self.get_serializer_context()).data

    def perform_create(self, serializer):
        template = serializer.validated_data.pop('workout_template', None)
        activate = serializer.validated_data.pop('activate', False)
        super().perform_create(serializer)
        season = serializer.instance
        season_service.create_default_phase(season, user=self.request.user, workout_template=template)
        if activate:
            season_service.change_status(season, SeasonStatus.ACTIVE, self.request.user)
        return season

    def perform_update(self, serializer):
        serializer.validated_data.pop('workout_template', None)
        serializer.validated_data.pop('activate', None)
        return super().perform_update(serializer)

    def check_can_destroy(self, instance):
        if instance.status not in season_service.DELETABLE_STATUSES:
            raise BusinessError(_("Chỉ xóa được mùa giải ở trạng thái Nháp hoặc Bỏ dở."))

    @extend_schema(tags=[TAG], summary="Đổi trạng thái mùa giải", request=SeasonStatusSerializer, responses=SeasonSerializer)
    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        season = self.get_object()
        serializer = SeasonStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        season_service.change_status(season, serializer.validated_data['status'], request.user)
        return success_response(data=self.serialize_read(season), message=_("Đã cập nhật trạng thái mùa giải"))

    @extend_schema(
        tags=[TAG], summary="Mùa giải đang chạy (ACTIVE) — của chính mình hoặc của học viên",
        parameters=[OpenApiParameter('client', int, required=False, description="Id học viên; bỏ trống = của chính mình")],
        responses=SeasonSerializer,
    )
    @action(detail=False, methods=['get'], url_path='active')
    def active(self, request):
        client_id = request.query_params.get('client')
        qs = self.get_queryset().filter(status=SeasonStatus.ACTIVE)
        if client_id:
            qs = qs.filter(client_id=client_id)
        else:
            qs = qs.filter(owner=request.user, client__isnull=True)
        season = qs.first()
        if season is None:
            raise NotFound(_("Không có mùa giải nào đang chạy."))
        return success_response(data=self.serialize_read(season))

    @extend_schema(tags=[TAG], summary="Giao mùa giải mẫu cho học viên", request=SeasonAssignSerializer, responses=SeasonSerializer)
    @action(detail=False, methods=['post'], url_path='assign')
    def assign(self, request):
        serializer = SeasonAssignSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        season = season_service.assign_template(
            data['template'],
            client=data['client'],
            start_date=data['start_date'],
            user=request.user,
            name=(data.get('name') or '').strip() or None,
            activate=data.get('activate', False),
        )
        return success_response(
            data=self.serialize_read(season), message=_("Đã giao mùa giải cho học viên"),
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    list=extend_schema(tags=[PHASE_TAG], summary="Danh sách giai đoạn (lọc ?season=)"),
    retrieve=extend_schema(tags=[PHASE_TAG], summary="Chi tiết giai đoạn"),
    create=extend_schema(tags=[PHASE_TAG], summary="Thêm giai đoạn vào mùa giải"),
    update=extend_schema(tags=[PHASE_TAG], summary="Cập nhật giai đoạn"),
    partial_update=extend_schema(tags=[PHASE_TAG], summary="Cập nhật một phần giai đoạn"),
    destroy=extend_schema(tags=[PHASE_TAG], summary="Xóa mềm giai đoạn"),
)
class PhaseViewSet(OwnedQuerysetMixin, BaseERPViewSet):
    """
    Giai đoạn của mùa giải + thực đơn (nutrition-plan) + nhật ký trong giai đoạn (chỉ đọc).
    Quyền theo phân hệ SEASON: đọc = SEASON_READ, mọi thao tác ghi = SEASON_UPDATE (sửa mùa giải).
    """
    queryset = (
        Phase.objects
        .select_related('season', 'workout_program', 'nutrition_plan', 'created_by', 'updated_by')
        .order_by('sort_order', 'start_date', 'id')
    )
    serializer_class = PhaseSerializer
    write_serializer_class = PhaseCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, ModulePermissionChecker]
    permission_module = 'SEASON'
    custom_action_permissions = {
        'create': 'SEASON_UPDATE',
        'destroy': 'SEASON_UPDATE',
        'batch_delete': 'SEASON_UPDATE',
        'nutrition_plan': 'SEASON_READ',
        'save_nutrition_plan': 'SEASON_UPDATE',
        'generate_nutrition_plan': 'SEASON_UPDATE',
        'refresh_snapshot': 'SEASON_UPDATE',
        'daily_logs': 'SEASON_READ',
    }
    owner_field = 'season__owner'
    owner_assign_field = None
    filterset_fields = {
        'season': ['exact'],
        'is_active': ['exact'],
        'start_date': ['gte', 'lte'],
        'end_date': ['gte', 'lte'],
    }
    search_fields = ['name', 'description']
    ordering_fields = ['sort_order', 'start_date', 'end_date', 'updated_at']

    def get_queryset(self):
        # Giai đoạn của mùa giải đã xóa mềm không còn truy cập được
        return super().get_queryset().filter(season__deleted_at__isnull=True)

    def get_plan(self, phase):
        return (
            NutritionPlan.objects.filter(phase=phase)
            .prefetch_related(Prefetch('meals', queryset=Meal.objects.order_by('sort_order', 'id').prefetch_related(
                Prefetch('items', queryset=MealItem.objects.select_related('food_category', 'food_item').order_by('sort_order', 'id'))
            )))
            .first()
        )

    def _plan_response(self, phase, message=None):
        plan = self.get_plan(phase)
        data = NutritionPlanSerializer(plan).data if plan else None
        return success_response(data=data, message=message or (_("Thành công") if plan else _("Giai đoạn chưa có thực đơn")))

    @extend_schema(tags=[PHASE_TAG], summary="Thực đơn của giai đoạn (null nếu chưa có)", responses=NutritionPlanSerializer)
    @action(detail=True, methods=['get'], url_path='nutrition-plan')
    def nutrition_plan(self, request, pk=None):
        return self._plan_response(self.get_object())

    @extend_schema(
        tags=[PHASE_TAG], summary="Lưu thực đơn (thay toàn bộ bữa + món)",
        request=NutritionPlanInputSerializer, responses=NutritionPlanSerializer,
    )
    @nutrition_plan.mapping.put
    def save_nutrition_plan(self, request, pk=None):
        phase = self.get_object()
        serializer = NutritionPlanInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nutrition_plan_service.save_plan(phase, **serializer.validated_data)
        return self._plan_response(phase, _("Đã lưu thực đơn"))

    @extend_schema(
        tags=[PHASE_TAG], summary="Sinh thực đơn gợi ý theo macro mục tiêu (thay thực đơn hiện có)",
        request=NutritionPlanGenerateSerializer, responses=NutritionPlanSerializer,
    )
    @action(detail=True, methods=['post'], url_path='nutrition-plan/generate')
    def generate_nutrition_plan(self, request, pk=None):
        phase = self.get_object()
        serializer = NutritionPlanGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nutrition_plan_service.generate_plan(phase, serializer.validated_data['meal_count'])
        return self._plan_response(phase, _("Đã sinh thực đơn gợi ý"))

    @extend_schema(tags=[PHASE_TAG], summary="Chụp lại snapshot giáo án đang gán", request=None, responses=PhaseSerializer)
    @action(detail=True, methods=['post'], url_path='refresh-snapshot')
    def refresh_snapshot(self, request, pk=None):
        from apps.workouts.services.program_service import snapshot_program
        phase = self.get_object()
        if not phase.workout_program_id:
            raise BusinessError(_("Giai đoạn chưa được gán giáo án."))
        with transaction.atomic():
            phase.workout_program_snapshot = snapshot_program(phase.workout_program)
            phase.updated_by = request.user
            phase.save(update_fields=['workout_program_snapshot', 'updated_by', 'updated_at'])
        return success_response(data=self.serialize_read(phase), message=_("Đã cập nhật ảnh chụp giáo án"))

    @extend_schema(tags=[PHASE_TAG], summary="Nhật ký hằng ngày trong giai đoạn (chỉ đọc)", responses=PhaseDailyLogSerializer(many=True))
    @action(detail=True, methods=['get'], url_path='daily-logs')
    def daily_logs(self, request, pk=None):
        phase = self.get_object()
        logs = DailyLog.objects.filter(phase=phase).order_by('log_date', 'id')
        return success_response(data=PhaseDailyLogSerializer(logs, many=True).data)
