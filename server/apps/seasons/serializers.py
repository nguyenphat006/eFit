from django.utils.translation import gettext as _
from rest_framework import serializers

from apps.clients.models import Client
from apps.core.messages import NAME_REQUIRED
from apps.core.ownership import is_data_admin
from apps.daily_logs.models import DailyLog
from apps.nutrition.models import FoodCategory, FoodItem
from apps.workouts.models import WorkoutProgram
from apps.workouts.services.program_service import validate_client_for_user

from .models import Meal, MealItem, NutritionPlan, Phase, Season, SeasonStatus
from .services.season_service import validate_phase_dates


def _owned_program(program, user):
    if program is None or is_data_admin(user) or program.owner_id == user.id:
        return program
    raise serializers.ValidationError(_("Giáo án không tồn tại hoặc không thuộc quyền quản lý của bạn."))


# ======================================================================= Phase
class PhaseSerializer(serializers.ModelSerializer):
    """Serializer ĐỌC giai đoạn."""
    season_name = serializers.CharField(source='season.name', read_only=True, default='')
    workout_program_name = serializers.CharField(source='workout_program.name', read_only=True, default=None)
    has_nutrition_plan = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = Phase
        fields = [
            'id', 'season', 'season_name', 'name', 'description', 'sort_order', 'start_date', 'end_date',
            'target_calories', 'target_protein', 'target_carbs', 'target_fat',
            'workout_program', 'workout_program_name', 'workout_program_snapshot', 'has_nutrition_plan',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_has_nutrition_plan(self, obj) -> bool:
        return hasattr(obj, 'nutrition_plan')


class PhaseCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer GHI giai đoạn — nằm trong mùa giải, không chồng lấn; đổi giáo án thì chụp lại snapshot.
    `season` chỉ nhận khi tạo mới.
    """
    season = serializers.PrimaryKeyRelatedField(queryset=Season.objects.all())
    workout_program = serializers.PrimaryKeyRelatedField(
        queryset=WorkoutProgram.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Phase
        fields = [
            'id', 'season', 'name', 'description', 'sort_order', 'start_date', 'end_date',
            'target_calories', 'target_protein', 'target_carbs', 'target_fat', 'workout_program', 'is_active',
        ]
        read_only_fields = ['id']
        extra_kwargs = {f: {'min_value': 0} for f in ('target_calories', 'target_protein', 'target_carbs', 'target_fat')}

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError(NAME_REQUIRED)
        return name

    def validate_season(self, value):
        user = self.context['request'].user
        if self.instance is not None and value.pk != self.instance.season_id:
            raise serializers.ValidationError(_("Không thể chuyển giai đoạn sang mùa giải khác."))
        if not is_data_admin(user) and value.owner_id != user.id:
            raise serializers.ValidationError(_("Mùa giải không tồn tại hoặc không thuộc quyền quản lý của bạn."))
        return value

    def validate_workout_program(self, value):
        return _owned_program(value, self.context['request'].user)

    def validate(self, attrs):
        season = attrs.get('season') or self.instance.season
        start = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        validate_phase_dates(season, start, end, exclude_id=getattr(self.instance, 'pk', None))
        return attrs

    def _apply_snapshot(self, validated_data):
        from apps.workouts.services.program_service import snapshot_program
        if 'workout_program' in validated_data:
            program = validated_data['workout_program']
            validated_data['workout_program_snapshot'] = snapshot_program(program) if program else None

    def create(self, validated_data):
        self._apply_snapshot(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('season', None)
        self._apply_snapshot(validated_data)
        return super().update(instance, validated_data)


# ====================================================================== Season
class SeasonListSerializer(serializers.ModelSerializer):
    """Serializer ĐỌC cho danh sách mùa giải."""
    owner_name = serializers.CharField(source='owner.full_name', read_only=True, default='')
    client_name = serializers.CharField(source='client.full_name', read_only=True, default=None)
    source_season_name = serializers.CharField(source='source_season.name', read_only=True, default=None)
    phase_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default='')
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True, default='')
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = Season
        fields = [
            'id', 'name', 'owner', 'owner_name', 'client', 'client_name', 'goal_type', 'start_date', 'end_date',
            'status', 'is_template', 'source_season', 'source_season_name', 'phase_count', 'description', 'is_active',
            'created_by_name', 'updated_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_phase_count(self, obj) -> int:
        annotated = getattr(obj, 'phase_count', None)
        if annotated is not None:
            return annotated
        return len(obj.phases.all())


class SeasonSerializer(SeasonListSerializer):
    """Serializer ĐỌC chi tiết — kèm danh sách giai đoạn."""
    phases = PhaseSerializer(many=True, read_only=True)

    class Meta(SeasonListSerializer.Meta):
        fields = SeasonListSerializer.Meta.fields + ['phases']
        read_only_fields = fields


class SeasonCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer GHI mùa giải. Trạng thái đổi qua action `change-status`, không sửa trực tiếp.
    Khi tạo: tự sinh "Phase 1" phủ cả mùa; `workout_template` (tùy chọn) được clone và gán cho Phase 1;
    `activate = true` kích hoạt ngay (đóng mùa ACTIVE cũ của cùng học viên).
    """
    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all(), required=False, allow_null=True)
    workout_template = serializers.PrimaryKeyRelatedField(
        queryset=WorkoutProgram.objects.all(), required=False, allow_null=True, write_only=True
    )
    activate = serializers.BooleanField(required=False, default=False, write_only=True)

    class Meta:
        model = Season
        fields = [
            'id', 'name', 'client', 'goal_type', 'start_date', 'end_date', 'is_template', 'description', 'is_active',
            'workout_template', 'activate',
        ]
        read_only_fields = ['id']

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError(NAME_REQUIRED)
        return name

    def validate_client(self, value):
        return validate_client_for_user(value, self.context['request'].user)

    def validate_workout_template(self, value):
        return _owned_program(value, self.context['request'].user)

    def validate(self, attrs):
        start = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': [_("Ngày kết thúc phải sau ngày bắt đầu.")]})
        if self.instance is not None and start and end:
            for phase in self.instance.phases.all():
                if phase.start_date < start or phase.end_date > end:
                    raise serializers.ValidationError({'start_date': [
                        _("Giai đoạn '%(name)s' nằm ngoài khoảng thời gian mới của mùa giải.") % {'name': phase.name}
                    ]})
        if attrs.get('activate') and attrs.get('is_template'):
            raise serializers.ValidationError({'activate': [_("Mùa giải mẫu không thể kích hoạt.")]})
        return attrs


class SeasonStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=SeasonStatus.choices)


class SeasonAssignSerializer(serializers.Serializer):
    """Giao mùa giải mẫu cho học viên."""
    template = serializers.PrimaryKeyRelatedField(queryset=Season.objects.filter(is_template=True))
    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all())
    start_date = serializers.DateField()
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    activate = serializers.BooleanField(required=False, default=False)

    def validate_template(self, value):
        user = self.context['request'].user
        if not is_data_admin(user) and value.owner_id != user.id:
            raise serializers.ValidationError(_("Mùa giải mẫu không tồn tại."))
        return value

    def validate_client(self, value):
        return validate_client_for_user(value, self.context['request'].user)


# ============================================================== NutritionPlan
class MealItemSerializer(serializers.ModelSerializer):
    food_category_code = serializers.CharField(source='food_category.category_code', read_only=True, default='')
    food_category_name = serializers.CharField(source='food_category.category_name', read_only=True, default='')
    food_item_name = serializers.CharField(source='food_item.name', read_only=True, default=None)

    class Meta:
        model = MealItem
        fields = [
            'id', 'food_category', 'food_category_code', 'food_category_name', 'food_item', 'food_item_name',
            'sort_order', 'target_calories', 'target_protein', 'target_carbs', 'target_fat',
            'primary_food_text', 'alternatives_text',
        ]
        read_only_fields = fields


class MealSerializer(serializers.ModelSerializer):
    items = MealItemSerializer(many=True, read_only=True)

    class Meta:
        model = Meal
        fields = ['id', 'name', 'sort_order', 'target_calories', 'target_protein', 'target_carbs', 'target_fat', 'items']
        read_only_fields = fields


class NutritionPlanSerializer(serializers.ModelSerializer):
    meals = MealSerializer(many=True, read_only=True)

    class Meta:
        model = NutritionPlan
        fields = [
            'id', 'phase', 'target_calories', 'target_protein', 'target_carbs', 'target_fat', 'notes', 'meals',
        ]
        read_only_fields = fields


MACRO_KWARGS = {'max_digits': 8, 'decimal_places': 2, 'min_value': 0}


class MealItemInputSerializer(serializers.Serializer):
    food_category = serializers.PrimaryKeyRelatedField(queryset=FoodCategory.objects.all())
    food_item = serializers.PrimaryKeyRelatedField(queryset=FoodItem.objects.all(), required=False, allow_null=True)
    sort_order = serializers.IntegerField(min_value=0, required=False)
    target_calories = serializers.DecimalField(**MACRO_KWARGS)
    target_protein = serializers.DecimalField(**MACRO_KWARGS)
    target_carbs = serializers.DecimalField(**MACRO_KWARGS)
    target_fat = serializers.DecimalField(**MACRO_KWARGS)
    primary_food_text = serializers.CharField(max_length=255)
    alternatives_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class MealInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    sort_order = serializers.IntegerField(min_value=0, required=False)
    target_calories = serializers.DecimalField(**MACRO_KWARGS)
    target_protein = serializers.DecimalField(**MACRO_KWARGS)
    target_carbs = serializers.DecimalField(**MACRO_KWARGS)
    target_fat = serializers.DecimalField(**MACRO_KWARGS)
    items = MealItemInputSerializer(many=True, required=False)


class NutritionPlanInputSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    meals = MealInputSerializer(many=True, required=False)


class NutritionPlanGenerateSerializer(serializers.Serializer):
    meal_count = serializers.IntegerField(min_value=1, max_value=8, required=False, default=4)


# ================================================================== Daily logs
class PhaseDailyLogSerializer(serializers.ModelSerializer):
    """Nhật ký trong giai đoạn (chỉ đọc — ghi qua phân hệ Nhật ký hằng ngày)."""

    class Meta:
        model = DailyLog
        fields = [
            'id', 'log_date', 'client', 'weight', 'calories_in', 'protein_in', 'carbs_in', 'fat_in',
            'target_calories_snapshot', 'target_protein_snapshot', 'target_carbs_snapshot', 'target_fat_snapshot',
            'sleep_hours', 'fatigue_level', 'is_workout_completed', 'steps', 'compliance_score',
        ]
        read_only_fields = fields
