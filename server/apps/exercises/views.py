from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions
from rest_framework.decorators import action

from apps.core.permissions import ModulePermissionChecker
from apps.core.responses import success_response
from apps.core.viewsets import BaseERPViewSet

from .models import Exercise
from .serializers import ExerciseCreateUpdateSerializer, ExerciseFilterOptionsSerializer, ExerciseSerializer

TAG = "Bài tập"
FILTER_OPTION_FIELDS = ('category', 'body_part', 'equipment', 'target')


@extend_schema_view(
    list=extend_schema(tags=[TAG], summary="Danh sách bài tập"),
    retrieve=extend_schema(tags=[TAG], summary="Chi tiết bài tập"),
    create=extend_schema(tags=[TAG], summary="Tạo mới bài tập"),
    update=extend_schema(tags=[TAG], summary="Cập nhật bài tập"),
    partial_update=extend_schema(tags=[TAG], summary="Cập nhật một phần bài tập"),
    destroy=extend_schema(tags=[TAG], summary="Xóa mềm bài tập"),
)
class ExerciseViewSet(BaseERPViewSet):
    """Thư viện bài tập dùng chung toàn hệ thống (không lọc theo người sở hữu)."""
    queryset = Exercise.objects.select_related('created_by', 'updated_by').order_by('-updated_at', 'id')
    serializer_class = ExerciseSerializer
    write_serializer_class = ExerciseCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, ModulePermissionChecker]
    permission_module = 'EXERCISE'
    custom_action_permissions = {'filter_options': 'EXERCISE_READ'}
    filterset_fields = {
        'is_active': ['exact'],
        'name': ['icontains'],
        'category': ['exact', 'in'],
        'body_part': ['exact', 'in'],
        'equipment': ['exact', 'in'],
        'target': ['exact', 'in'],
        'updated_at': ['date__gte', 'date__lte'],
    }
    search_fields = ['name', 'target', 'muscle_group', 'body_part', 'equipment']
    ordering_fields = ['created_at', 'updated_at', 'name', 'category', 'body_part', 'equipment', 'target']
    excel_excluded_fields = ['instructions', 'secondary_muscles']

    @extend_schema(tags=[TAG], summary="Giá trị phân biệt cho bộ lọc (nhóm, vùng cơ, dụng cụ, cơ mục tiêu)",
                   responses=ExerciseFilterOptionsSerializer)
    @action(detail=False, methods=['get'], url_path='filter-options')
    def filter_options(self, request):
        qs = Exercise.objects.order_by()
        data = {
            name: sorted(v for v in qs.values_list(name, flat=True).distinct() if v)
            for name in FILTER_OPTION_FIELDS
        }
        return success_response(data=data)
