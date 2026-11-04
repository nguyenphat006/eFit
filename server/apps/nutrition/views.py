from django.db.models import Count, Q
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

from apps.core.exceptions import BusinessError
from apps.core.ownership import is_data_admin
from apps.core.permissions import ModulePermissionChecker
from apps.core.viewsets import BaseERPViewSet

from .models import FoodCategory, FoodItem
from .serializers import (
    FoodCategoryCreateUpdateSerializer,
    FoodCategorySerializer,
    FoodItemCreateUpdateSerializer,
    FoodItemSerializer,
)


def crud_schema(tag: str, entity: str):
    """Gắn tag + summary tiếng Việt cho 6 action CRUD trên Swagger."""
    return extend_schema_view(
        list=extend_schema(tags=[tag], summary=f"Danh sách {entity}"),
        retrieve=extend_schema(tags=[tag], summary=f"Chi tiết {entity}"),
        create=extend_schema(tags=[tag], summary=f"Tạo mới {entity}"),
        update=extend_schema(tags=[tag], summary=f"Cập nhật {entity}"),
        partial_update=extend_schema(tags=[tag], summary=f"Cập nhật một phần {entity}"),
        destroy=extend_schema(tags=[tag], summary=f"Xóa mềm {entity}"),
    )


@crud_schema("Nhóm thực phẩm", "nhóm thực phẩm")
class FoodCategoryViewSet(BaseERPViewSet):
    """Nhóm thực phẩm — sắp theo sort_order; không xóa được nhóm đang có thực phẩm."""
    queryset = (
        FoodCategory.objects.select_related('created_by', 'updated_by')
        .annotate(food_count=Count('foods', filter=Q(foods__deleted_at__isnull=True)))
        .order_by('sort_order', 'id')
    )
    serializer_class = FoodCategorySerializer
    write_serializer_class = FoodCategoryCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, ModulePermissionChecker]
    permission_module = 'FOOD_CATEGORY'
    filterset_fields = {
        'is_active': ['exact'],
        'category_code': ['icontains'],
        'category_name': ['icontains'],
        'updated_at': ['date__gte', 'date__lte'],
    }
    search_fields = ['category_code', 'category_name', 'description']
    ordering_fields = ['sort_order', 'created_at', 'updated_at', 'category_code', 'category_name']

    def check_can_destroy(self, instance):
        if instance.foods.exists():
            raise BusinessError(_("Không thể xóa nhóm thực phẩm đang có thực phẩm."))


@crud_schema("Thực phẩm", "thực phẩm")
class FoodItemViewSet(BaseERPViewSet):
    """
    Thư viện thực phẩm. Dữ liệu hệ thống (is_system_data) chỉ ADMIN sửa / xóa;
    thực phẩm người dùng tự tạo chỉ người tạo hoặc ADMIN sửa / xóa.
    """
    queryset = FoodItem.objects.select_related('category', 'created_by', 'updated_by').order_by('-updated_at', 'id')
    serializer_class = FoodItemSerializer
    write_serializer_class = FoodItemCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, ModulePermissionChecker]
    permission_module = 'FOOD_ITEM'
    filterset_fields = {
        'is_active': ['exact'],
        'name': ['icontains'],
        'category': ['exact', 'in'],
        'category__category_code': ['exact', 'in'],
        'is_system_data': ['exact'],
        'calories': ['gte', 'lte'],
        'protein': ['gte', 'lte'],
        'carbs': ['gte', 'lte'],
        'fat': ['gte', 'lte'],
        'updated_at': ['date__gte', 'date__lte'],
    }
    search_fields = ['name', 'category__category_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name', 'calories', 'protein', 'carbs', 'fat']

    def _check_can_modify(self, instance):
        user = self.request.user
        if is_data_admin(user):
            return
        if instance.is_system_data:
            raise PermissionDenied(_("Không thể sửa / xóa dữ liệu thực phẩm hệ thống."))
        if instance.created_by_id != user.id:
            raise PermissionDenied(_("Bạn chỉ được sửa / xóa thực phẩm do mình tạo."))

    def perform_create(self, serializer):
        if not is_data_admin(self.request.user):
            serializer.validated_data['is_system_data'] = False
        return super().perform_create(serializer)

    def perform_update(self, serializer):
        self._check_can_modify(serializer.instance)
        if not is_data_admin(self.request.user):
            serializer.validated_data.pop('is_system_data', None)
        return super().perform_update(serializer)

    def check_can_destroy(self, instance):
        self._check_can_modify(instance)
        if instance.meal_items.exists():
            raise BusinessError(_("Không thể xóa thực phẩm đang được dùng trong thực đơn."))

    def check_can_change_status(self, instance, is_active: bool):
        self._check_can_modify(instance)
