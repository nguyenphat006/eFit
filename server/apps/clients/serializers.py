from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _
from rest_framework import serializers

from apps.core.messages import NAME_REQUIRED

from .models import Client, FitnessProfile

User = get_user_model()

MEASURE_FIELDS = ('height_cm', 'current_weight', 'body_fat_percentage', 'chest_measure', 'waist_measure',
                  'hips_measure', 'arm_measure', 'leg_measure')


def validate_activity_level(value):
    if value is not None and not (1.2 <= float(value) <= 1.9):
        raise serializers.ValidationError(_("Hệ số vận động phải trong khoảng 1.2 - 1.9."))
    return value


def validate_non_negative(attrs, fields):
    for field in fields:
        val = attrs.get(field)
        if val is not None and val < 0:
            raise serializers.ValidationError({field: [_("Giá trị không được âm.")]})


class ClientSerializer(serializers.ModelSerializer):
    """Serializer ĐỌC học viên — dùng cho mọi response."""
    coach_name = serializers.CharField(source='coach.full_name', read_only=True, default='')
    user_username = serializers.CharField(source='user.username', read_only=True, default=None)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default='')
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True, default='')
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = Client
        fields = [
            'id', 'coach', 'coach_name', 'user', 'user_username', 'full_name', 'phone', 'email', 'gender',
            'date_of_birth', *MEASURE_FIELDS, 'fitness_goal', 'activity_level', 'training_frequency',
            'notes', 'status', 'description', 'is_active',
            'created_by_name', 'updated_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class ClientCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer GHI học viên. `coach` chỉ ADMIN được đặt (view bỏ qua với người khác, mặc định = người tạo).
    Liên kết tài khoản đi qua action link-account, không ghi trực tiếp `user`.
    """
    coach = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(deleted_at__isnull=True), required=False)

    class Meta:
        model = Client
        fields = [
            'id', 'coach', 'full_name', 'phone', 'email', 'gender', 'date_of_birth', *MEASURE_FIELDS,
            'fitness_goal', 'activity_level', 'training_frequency', 'notes', 'status', 'description', 'is_active',
        ]
        read_only_fields = ['id']

    def validate_full_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError(NAME_REQUIRED)
        return name

    def validate_activity_level(self, value):
        return validate_activity_level(value)

    def validate_training_frequency(self, value):
        if value is not None and value > 14:
            raise serializers.ValidationError(_("Số buổi tập / tuần không hợp lệ."))
        return value

    def validate(self, attrs):
        validate_non_negative(attrs, MEASURE_FIELDS)
        return attrs


class ClientLinkAccountSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


class FitnessProfileSerializer(serializers.ModelSerializer):
    """Hồ sơ thể chất của chính người dùng (đọc + ghi)."""
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = FitnessProfile
        fields = [
            'id', 'gender', 'date_of_birth', 'height_cm', 'current_weight', 'body_fat_percentage',
            'activity_level', 'fitness_goal', 'training_frequency', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']

    def validate_activity_level(self, value):
        return validate_activity_level(value)

    def validate(self, attrs):
        validate_non_negative(attrs, ('height_cm', 'current_weight', 'body_fat_percentage'))
        return attrs
