"""
API Trợ lý AI (không có bảng riêng). Quyền: AI_COACH_READ.
- status/             : AI đã cấu hình chưa (frontend hiện cảnh báo chế độ offline)
- ask/                : hỏi đáp tự do (cần GEMINI_API_KEY, thiếu -> business_rule)
- suggest-nutrition/  : gợi ý macro / ngày (thiếu khóa -> tính offline)
- meal-plan/          : chia macro thành 3 bữa theo nhóm thực phẩm (thiếu khóa -> tính offline)
"""
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers
from rest_framework.views import APIView

from apps.core.permissions import HasPermission
from apps.core.responses import success_response

from .services import chat, gemini, nutrition

TAG = "Trợ lý AI"
GOAL_CHOICES = list(nutrition.GOAL_LABELS)


class AiPermissionMixin:
    permission_classes = [permissions.IsAuthenticated, HasPermission('AI_COACH_READ')]


# ---------------------------------------------------------------- serializers
class ChatTurnSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['user', 'assistant'])
    content = serializers.CharField(max_length=4000)


class AskSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=2000, trim_whitespace=True)
    history = ChatTurnSerializer(many=True, required=False, default=list)


class AskResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()


class AiStatusSerializer(serializers.Serializer):
    configured = serializers.BooleanField()
    model = serializers.CharField(allow_null=True)


class SuggestNutritionSerializer(serializers.Serializer):
    goal = serializers.ChoiceField(choices=GOAL_CHOICES)
    phase_description = serializers.CharField(max_length=2000, required=False, allow_blank=True, default='')
    gender = serializers.CharField(max_length=10, required=False, allow_null=True, allow_blank=True)
    age = serializers.IntegerField(min_value=10, max_value=100, required=False, allow_null=True)
    height = serializers.FloatField(min_value=50, max_value=250, required=False, allow_null=True)
    current_weight = serializers.FloatField(min_value=20, max_value=400, required=False, allow_null=True)
    body_fat_percentage = serializers.FloatField(min_value=1, max_value=70, required=False, allow_null=True)
    activity_level = serializers.FloatField(min_value=1.2, max_value=1.9, required=False, allow_null=True)


class NutritionSuggestionSerializer(serializers.Serializer):
    calories = serializers.IntegerField()
    protein = serializers.IntegerField()
    carbs = serializers.IntegerField()
    fat = serializers.IntegerField()
    explanation = serializers.CharField()
    source = serializers.ChoiceField(choices=['ai', 'offline'])


class MealPlanTargetsSerializer(serializers.Serializer):
    target_calories = serializers.FloatField(min_value=500, max_value=10000)
    target_protein = serializers.FloatField(min_value=0, max_value=1000)
    target_carbs = serializers.FloatField(min_value=0, max_value=2000)
    target_fat = serializers.FloatField(min_value=0, max_value=1000)


class MealPlanItemSerializer(serializers.Serializer):
    food_category_code = serializers.CharField()
    target_protein = serializers.IntegerField()
    target_carbs = serializers.IntegerField()
    target_fat = serializers.IntegerField()


class MealPlanMealSerializer(serializers.Serializer):
    name = serializers.CharField()
    target_calories = serializers.IntegerField()
    target_protein = serializers.IntegerField()
    target_carbs = serializers.IntegerField()
    target_fat = serializers.IntegerField()
    items = MealPlanItemSerializer(many=True)


class MealPlanSerializer(serializers.Serializer):
    notes = serializers.CharField(allow_blank=True)
    meals = MealPlanMealSerializer(many=True)
    source = serializers.ChoiceField(choices=['ai', 'offline'])


# ---------------------------------------------------------------------- views
def _profile_context(user) -> str:
    profile = getattr(user, 'fitness_profile', None)
    if profile is None or profile.deleted_at is not None:
        return ''
    parts = [
        ('Giới tính', profile.get_gender_display() if profile.gender else None),
        ('Chiều cao (cm)', profile.height_cm),
        ('Cân nặng (kg)', profile.current_weight),
        ('Tỷ lệ mỡ (%)', profile.body_fat_percentage),
        ('Mục tiêu', profile.get_fitness_goal_display()),
        ('Số buổi tập / tuần', profile.training_frequency),
    ]
    return '\n'.join(f'- {label}: {value}' for label, value in parts if value not in (None, ''))


class StatusView(AiPermissionMixin, APIView):
    @extend_schema(tags=[TAG], summary="Trạng thái cấu hình AI", responses=AiStatusSerializer)
    def get(self, request):
        from django.conf import settings

        configured = gemini.is_configured()
        return success_response(data={'configured': configured, 'model': settings.GEMINI_MODEL if configured else None})


class AskView(AiPermissionMixin, APIView):
    @extend_schema(tags=[TAG], summary="Hỏi đáp với eFit AI", request=AskSerializer, responses=AskResponseSerializer)
    def post(self, request):
        serializer = AskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        answer = chat.ask(data['question'], data.get('history') or [], _profile_context(request.user))
        return success_response(data={'answer': answer})


class SuggestNutritionView(AiPermissionMixin, APIView):
    @extend_schema(
        tags=[TAG], summary="Gợi ý mục tiêu dinh dưỡng / ngày",
        request=SuggestNutritionSerializer, responses=NutritionSuggestionSerializer,
    )
    def post(self, request):
        serializer = SuggestNutritionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        goal = data.pop('goal')
        phase_description = data.pop('phase_description', '')
        result = nutrition.suggest_nutrition(data, goal, phase_description)
        return success_response(data=NutritionSuggestionSerializer(result).data, message=_("Đã tạo gợi ý dinh dưỡng"))


class MealPlanView(AiPermissionMixin, APIView):
    @extend_schema(
        tags=[TAG], summary="Chia macro mục tiêu thành thực đơn 3 bữa (chưa lưu)",
        request=MealPlanTargetsSerializer, responses=MealPlanSerializer,
    )
    def post(self, request):
        serializer = MealPlanTargetsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        result = nutrition.generate_meal_plan(d['target_calories'], d['target_protein'], d['target_carbs'], d['target_fat'])
        return success_response(data=MealPlanSerializer(result).data, message=_("Đã tạo thực đơn gợi ý"))
