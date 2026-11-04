from django.db.models import Count, Prefetch
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions, status
from rest_framework.decorators import action

from apps.core.exceptions import BusinessError
from apps.core.ownership import OwnedQuerysetMixin
from apps.core.permissions import ModulePermissionChecker
from apps.core.responses import success_response
from apps.core.viewsets import BaseERPViewSet

from .models import WorkoutDay, WorkoutExercise, WorkoutProgram
from .serializers import (
    WorkoutProgramCloneSerializer,
    WorkoutProgramCreateUpdateSerializer,
    WorkoutProgramListSerializer,
    WorkoutProgramSerializer,
)
from .services.program_service import clone_program

TAG = "Giáo án tập"


@extend_schema_view(
    list=extend_schema(tags=[TAG], summary="Danh sách giáo án tập"),
    retrieve=extend_schema(tags=[TAG], summary="Chi tiết giáo án tập (kèm buổi tập + bài tập)"),
    create=extend_schema(tags=[TAG], summary="Tạo mới giáo án tập (có thể gửi kèm cả cây days)"),
    update=extend_schema(tags=[TAG], summary="Cập nhật giáo án tập (gửi days -> thay toàn bộ buổi tập)"),
    partial_update=extend_schema(tags=[TAG], summary="Cập nhật một phần giáo án tập"),
    destroy=extend_schema(tags=[TAG], summary="Xóa mềm giáo án tập"),
)
class WorkoutProgramViewSet(OwnedQuerysetMixin, BaseERPViewSet):
    """
    Giáo án tập: CRUD (ghi cả cây buổi tập -> bài tập), clone, statistics, batch, export từ BaseERPViewSet.
    Người dùng thường chỉ thấy giáo án mình sở hữu; ADMIN thấy tất cả.
    """
    queryset = (
        WorkoutProgram.objects
        .select_related('created_by', 'updated_by', 'owner', 'client', 'source_program')
        .order_by('-updated_at', 'id')
    )
    serializer_class = WorkoutProgramSerializer
    write_serializer_class = WorkoutProgramCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, ModulePermissionChecker]
    permission_module = 'WORKOUT_PROGRAM'
    custom_action_permissions = {'clone': 'WORKOUT_PROGRAM_CREATE'}
    owner_field = 'owner'
    filterset_fields = {
        'is_active': ['exact'],
        'is_template': ['exact'],
        'client': ['exact', 'isnull', 'in'],
        'name': ['icontains'],
        'frequency_per_week': ['exact', 'gte', 'lte'],
        'updated_at': ['date__gte', 'date__lte'],
    }
    search_fields = ['name', 'notes', 'description', 'client__full_name']
    ordering_fields = ['created_at', 'updated_at', 'name', 'frequency_per_week', 'start_date']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            return qs.annotate(day_count=Count('days', distinct=True))
        return qs.prefetch_related(
            Prefetch('days', queryset=WorkoutDay.objects.order_by('sort_order', 'id').prefetch_related(
                Prefetch('exercises', queryset=WorkoutExercise.objects.order_by('sort_order', 'id'))
            ))
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkoutProgramListSerializer
        if self.action == 'clone':
            return WorkoutProgramCloneSerializer
        return super().get_serializer_class()

    def serialize_read(self, instance):
        # Đọc lại có prefetch để response sau khi ghi phản ánh đúng cây mới
        fresh = self.get_queryset().model.objects.prefetch_related('days__exercises').select_related(
            'owner', 'client', 'source_program', 'created_by', 'updated_by'
        ).get(pk=instance.pk)
        return WorkoutProgramSerializer(fresh, context=self.get_serializer_context()).data

    def check_can_destroy(self, instance):
        from apps.seasons.models import Phase
        if Phase.objects.filter(workout_program=instance).exists():
            raise BusinessError(_("Giáo án đang được gán cho giai đoạn của mùa giải, không thể xóa."))

    @extend_schema(
        tags=[TAG], summary="Sao chép giáo án (sang học viên / chính mình / thành mẫu)",
        request=WorkoutProgramCloneSerializer, responses=WorkoutProgramSerializer,
    )
    @action(detail=True, methods=['post'], url_path='clone')
    def clone(self, request, pk=None):
        source = self.get_object()
        serializer = WorkoutProgramCloneSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        clone = clone_program(
            source,
            owner=request.user,
            user=request.user,
            client=data.get('client'),
            name=(data.get('name') or '').strip() or None,
            is_template=data.get('is_template', False),
        )
        return success_response(
            data=self.serialize_read(clone),
            message=_("Đã sao chép giáo án thành công"),
            status_code=status.HTTP_201_CREATED,
        )
