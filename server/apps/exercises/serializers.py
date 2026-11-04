from django.utils.translation import gettext as _
from rest_framework import serializers

from apps.core.messages import NAME_REQUIRED

from .models import Exercise


class ExerciseSerializer(serializers.ModelSerializer):
    """Serializer ĐỌC — dùng cho mọi response (list, detail, sau create/update)."""
    secondary_muscles = serializers.JSONField(read_only=True)
    instructions = serializers.JSONField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default='')
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True, default='')
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = Exercise
        fields = [
            'id', 'name', 'category', 'body_part', 'equipment', 'target', 'muscle_group',
            'secondary_muscles', 'instructions', 'media_id', 'image_url', 'video_url',
            'description', 'is_active', 'created_by_name', 'updated_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class ExerciseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer GHI — tên bắt buộc; cơ phụ là mảng chuỗi."""
    secondary_muscles = serializers.ListField(
        child=serializers.CharField(max_length=100), required=False, allow_null=True
    )
    instructions = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Exercise
        fields = [
            'id', 'name', 'category', 'body_part', 'equipment', 'target', 'muscle_group',
            'secondary_muscles', 'instructions', 'media_id', 'image_url', 'video_url',
            'description', 'is_active',
        ]
        read_only_fields = ['id']

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError(NAME_REQUIRED)
        return name

    def validate_instructions(self, value):
        # Cho phép: chuỗi, mảng bước, hoặc {ngôn ngữ: chuỗi | mảng bước}
        if value is None or isinstance(value, (str, list, dict)):
            return value
        raise serializers.ValidationError(_("Hướng dẫn phải là văn bản, danh sách bước hoặc theo ngôn ngữ."))


class ExerciseFilterOptionsSerializer(serializers.Serializer):
    """Giá trị phân biệt dùng cho bộ lọc danh sách bài tập."""
    category = serializers.ListField(child=serializers.CharField())
    body_part = serializers.ListField(child=serializers.CharField())
    equipment = serializers.ListField(child=serializers.CharField())
    target = serializers.ListField(child=serializers.CharField())
