from django.utils.translation import gettext as _
from rest_framework import serializers

from apps.core.messages import DUPLICATE_CODE, NAME_REQUIRED

from .models import FoodCategory, FoodItem


class FoodCategorySerializer(serializers.ModelSerializer):
    """Serializer ĐỌC nhóm thực phẩm (kèm số thực phẩm đang dùng nhóm — annotate ở queryset)."""
    food_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default='')
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True, default='')
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = FoodCategory
        fields = [
            'id', 'category_code', 'category_name', 'sort_order', 'food_count', 'description', 'is_active',
            'created_by_name', 'updated_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_food_count(self, obj) -> int:
        return getattr(obj, 'food_count', 0) or 0


class FoodCategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer GHI — mã tự viết hoa, kiểm tra trùng cả bản ghi đã xóa mềm."""

    class Meta:
        model = FoodCategory
        fields = ['id', 'category_code', 'category_name', 'sort_order', 'description', 'is_active']
        read_only_fields = ['id']
        extra_kwargs = {'category_code': {'validators': []}}

    def validate_category_code(self, value):
        code = value.strip().upper()
        if not code:
            raise serializers.ValidationError(_("Mã nhóm không được để trống."))
        qs = FoodCategory.all_objects.filter(category_code=code)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(DUPLICATE_CODE % {"code": code})
        return code

    def validate_category_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError(NAME_REQUIRED)
        return name


class FoodItemSerializer(serializers.ModelSerializer):
    """Serializer ĐỌC thực phẩm (kèm mã / tên nhóm)."""
    category_code = serializers.CharField(source='category.category_code', read_only=True)
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default='')
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True, default='')
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = FoodItem
        fields = [
            'id', 'category', 'category_code', 'category_name', 'name',
            'calories', 'protein', 'carbs', 'fat', 'fiber', 'image_url',
            'base_unit', 'default_serving_name', 'default_serving_weight', 'is_system_data',
            'description', 'is_active', 'created_by_name', 'updated_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class FoodItemCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer GHI thực phẩm. `is_system_data` chỉ ADMIN được đặt (view ép False cho người khác)."""

    class Meta:
        model = FoodItem
        fields = [
            'id', 'category', 'name', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'image_url',
            'base_unit', 'default_serving_name', 'default_serving_weight', 'is_system_data',
            'description', 'is_active',
        ]
        read_only_fields = ['id']

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError(NAME_REQUIRED)
        return name

    def validate_category(self, value):
        if value.deleted_at is not None:
            raise serializers.ValidationError(_("Nhóm thực phẩm không tồn tại."))
        return value

    def validate(self, attrs):
        for field in ('calories', 'protein', 'carbs', 'fat', 'fiber', 'default_serving_weight'):
            val = attrs.get(field)
            if val is not None and val < 0:
                raise serializers.ValidationError({field: [_("Giá trị không được âm.")]})
        return attrs
