from django.utils.translation import gettext as _
from rest_framework import serializers

from apps.clients.models import Client
from apps.seasons.models import Phase

from .models import DailyLog
from .services.metrics import calculate_dfi


class NumericDecimalMixin:
    """Trả số thập phân dạng number (không phải chuỗi) để frontend vẽ biểu đồ / tính toán trực tiếp."""

    def build_standard_field(self, field_name, model_field):
        field_class, field_kwargs = super().build_standard_field(field_name, model_field)
        if field_class is serializers.DecimalField:
            field_kwargs['coerce_to_string'] = False
        return field_class, field_kwargs


METRIC_FIELDS = [
    'weight', 'calories_in', 'protein_in', 'carbs_in', 'fat_in',
    'sleep_hours', 'work_hours', 'fatigue_level', 'is_workout_completed',
    'diet_meals_completed', 'diet_completed_meal_ids', 'diet_target_meals', 'diet_protein_estimated',
    'diet_cheat_status', 'diet_notes',
    'steps', 'cardio_duration_minutes', 'cardio_type',
    'body_images',
    'chest_measure', 'waist_measure', 'hips_measure', 'arm_measure', 'leg_measure',
    'compliance_notes', 'description',
]


class DailyLogSerializer(NumericDecimalMixin, serializers.ModelSerializer):
    """Serializer ĐỌC — dùng cho mọi response (list, detail, sau create/update/upsert)."""
    owner_name = serializers.CharField(source='owner.full_name', read_only=True, default='')
    client_name = serializers.CharField(source='client.full_name', read_only=True, default=None, allow_null=True)
    phase_name = serializers.CharField(source='phase.name', read_only=True, default=None, allow_null=True)
    season_id = serializers.IntegerField(source='phase.season_id', read_only=True, default=None, allow_null=True)
    diet_completed_meal_ids = serializers.ListField(child=serializers.IntegerField(), read_only=True, allow_null=True)
    body_images = serializers.ListField(child=serializers.CharField(), read_only=True, allow_null=True)
    dfi = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = DailyLog
        fields = [
            'id', 'owner', 'owner_name', 'client', 'client_name', 'phase', 'phase_name', 'season_id', 'log_date',
            'target_calories_snapshot', 'target_protein_snapshot', 'target_carbs_snapshot', 'target_fat_snapshot',
            *METRIC_FIELDS, 'compliance_score', 'dfi', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_dfi(self, obj) -> float | None:
        return calculate_dfi(obj.sleep_hours, obj.work_hours, obj.fatigue_level)


class DailyLogCreateUpdateSerializer(NumericDecimalMixin, serializers.ModelSerializer):
    """
    Serializer GHI — dùng cho create / update / upsert. Không nhận owner / snapshot / điểm kỷ luật
    (hệ thống tự gán và tính lại).
    """
    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all(), required=False, allow_null=True)
    phase = serializers.PrimaryKeyRelatedField(queryset=Phase.objects.all(), required=False, allow_null=True)
    diet_completed_meal_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), required=False, allow_null=True
    )
    body_images = serializers.ListField(
        child=serializers.CharField(max_length=500), required=False, allow_null=True, max_length=20
    )

    class Meta:
        model = DailyLog
        fields = ['id', 'client', 'phase', 'log_date', *METRIC_FIELDS]
        read_only_fields = ['id']
        extra_kwargs = {
            'weight': {'min_value': 0},
            'calories_in': {'min_value': 0},
            'protein_in': {'min_value': 0},
            'carbs_in': {'min_value': 0},
            'fat_in': {'min_value': 0},
            'diet_target_meals': {'min_value': 1},
        }

    def validate(self, attrs):
        if self.instance is not None:
            for field in ('client', 'phase', 'log_date'):
                if field in attrs and attrs[field] != getattr(self.instance, field):
                    raise serializers.ValidationError(
                        {field: [_("Không đổi được ngày / học viên / giai đoạn của nhật ký đã tạo.")]}
                    )
        return attrs


class DailyLogUpsertSerializer(DailyLogCreateUpdateSerializer):
    """Ghi nhanh theo ngày: chỉ `log_date` bắt buộc, các trường khác gửi gì cập nhật nấy."""

    class Meta(DailyLogCreateUpdateSerializer.Meta):
        extra_kwargs = {**DailyLogCreateUpdateSerializer.Meta.extra_kwargs, 'log_date': {'required': True}}


class DailyLogHistoryPointSerializer(serializers.Serializer):
    date = serializers.DateField()
    weight = serializers.FloatField(allow_null=True)
    sleep_hours = serializers.FloatField(allow_null=True)
    work_hours = serializers.FloatField(allow_null=True)
    fatigue_level = serializers.IntegerField(allow_null=True)
    calories_in = serializers.FloatField(allow_null=True)
    compliance_score = serializers.FloatField(allow_null=True)
    dfi = serializers.FloatField(allow_null=True)


class DailyLogTodaySerializer(serializers.Serializer):
    date = serializers.DateField()
    has_log = serializers.BooleanField()
    dfi = serializers.FloatField(allow_null=True)
    weight = serializers.FloatField(allow_null=True)
    sleep_hours = serializers.FloatField(allow_null=True)
    compliance_score = serializers.FloatField(allow_null=True)


class DailyLogSummarySerializer(serializers.Serializer):
    today = DailyLogTodaySerializer()
    log_adherence_7d = serializers.FloatField()
    compliance_avg_7d = serializers.FloatField(allow_null=True)
    history_7d = DailyLogHistoryPointSerializer(many=True)

