"""
Thực đơn của giai đoạn: lưu cả cây (bữa -> món) thay thế bản cũ, sao chép khi giao mùa mẫu,
và sinh thực đơn gợi ý theo macro mục tiêu (chia đều theo bữa, quy đổi gam từ thư viện thực phẩm).
"""
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.utils.translation import gettext as _

from apps.core.exceptions import BusinessError
from apps.nutrition.models import FoodCategory, FoodItem

from ..models import Meal, MealItem, NutritionPlan, Phase

MACRO_FIELDS = ('target_calories', 'target_protein', 'target_carbs', 'target_fat')

# Nhóm thực phẩm -> macro dùng để quy đổi khối lượng (mặc định: protein)
CATEGORY_MATCH_MACRO = {
    'GRAINS': 'carbs', 'FRUITS': 'carbs', 'VEGETABLES': 'carbs',
    'FATS': 'fat', 'NUTS': 'fat',
}
# Thành phần một bữa khi sinh tự động: (mã nhóm, macro mục tiêu của món)
GENERATED_MEAL_COMPONENTS = (('MEATS', 'protein'), ('GRAINS', 'carbs'), ('FATS', 'fat'))


def _phase_targets(phase: Phase) -> dict:
    return {f: getattr(phase, f) or Decimal('0') for f in MACRO_FIELDS}


def save_plan(phase: Phase, *, notes=None, meals=None) -> NutritionPlan:
    """Thay toàn bộ thực đơn của giai đoạn. Mục tiêu tổng chụp lại từ giai đoạn."""
    with transaction.atomic():
        NutritionPlan.objects.filter(phase=phase).delete()
        plan = NutritionPlan.objects.create(phase=phase, notes=notes, **_phase_targets(phase))
        for meal_index, meal in enumerate(meals or []):
            meal_obj = Meal.objects.create(
                plan=plan,
                name=meal['name'],
                sort_order=meal.get('sort_order', meal_index),
                **{f: meal.get(f) or 0 for f in MACRO_FIELDS},
            )
            MealItem.objects.bulk_create([
                MealItem(
                    meal=meal_obj,
                    food_category=item['food_category'],
                    food_item=item.get('food_item'),
                    sort_order=item.get('sort_order', item_index),
                    primary_food_text=item['primary_food_text'],
                    alternatives_text=item.get('alternatives_text'),
                    **{f: item.get(f) or 0 for f in MACRO_FIELDS},
                )
                for item_index, item in enumerate(meal.get('items') or [])
            ])
    return plan


def copy_plan(source: NutritionPlan, phase: Phase) -> NutritionPlan:
    """Sao chép thực đơn sang giai đoạn khác (giữ nguyên macro từng bữa / món)."""
    meals = []
    for meal in source.meals.prefetch_related('items').all():
        meals.append({
            'name': meal.name,
            'sort_order': meal.sort_order,
            **{f: getattr(meal, f) for f in MACRO_FIELDS},
            'items': [
                {
                    'food_category': item.food_category,
                    'food_item': item.food_item,
                    'sort_order': item.sort_order,
                    'primary_food_text': item.primary_food_text,
                    'alternatives_text': item.alternatives_text,
                    **{f: getattr(item, f) for f in MACRO_FIELDS},
                }
                for item in meal.items.all()
            ],
        })
    return save_plan(phase, notes=source.notes, meals=meals)


def food_suggestions(category: FoodCategory, target_value: Decimal, limit: int = 4):
    """
    Quy đổi khối lượng (làm tròn 10g) của các thực phẩm trong nhóm để đạt `target_value` của macro tương ứng.
    Trả (món chính, chuỗi "Có thể thay bằng: ...").
    """
    macro = CATEGORY_MATCH_MACRO.get(category.category_code, 'protein')
    options = []
    for food in FoodItem.objects.filter(category=category, **{f'{macro}__gt': 0}).order_by('name')[:limit]:
        grams = (Decimal(target_value) / getattr(food, macro) * 100).quantize(Decimal('1E1'), rounding=ROUND_HALF_UP)
        if grams > 0:
            options.append((food, f"{int(grams)}g {food.name}"))
    if not options:
        return None, category.category_name, None
    primary_food, primary_text = options[0]
    alternatives = [text for _food, text in options[1:]]
    alt_text = _("Có thể thay bằng: %(items)s") % {'items': ', '.join(alternatives)} if alternatives else None
    return primary_food, primary_text, alt_text


def generate_plan(phase: Phase, meal_count: int = 4) -> NutritionPlan:
    """Sinh thực đơn gợi ý: chia đều macro mục tiêu cho `meal_count` bữa, mỗi bữa gồm nguồn đạm / tinh bột / béo."""
    if not all(getattr(phase, f) for f in MACRO_FIELDS):
        raise BusinessError(_("Giai đoạn cần có đủ mục tiêu calo, đạm, tinh bột, chất béo trước khi sinh thực đơn."))
    categories = {c.category_code: c for c in FoodCategory.objects.filter(
        category_code__in=[code for code, _macro in GENERATED_MEAL_COMPONENTS]
    )}
    if not categories:
        raise BusinessError(_("Thư viện thực phẩm chưa có nhóm MEATS / GRAINS / FATS để sinh thực đơn."))

    count = Decimal(meal_count)
    per_meal = {
        'protein': (phase.target_protein / count).quantize(Decimal('1')),
        'carbs': (phase.target_carbs / count).quantize(Decimal('1')),
        'fat': (phase.target_fat / count).quantize(Decimal('1')),
    }
    meals = []
    for index in range(meal_count):
        items = []
        for code, macro in GENERATED_MEAL_COMPONENTS:
            category = categories.get(code)
            if category is None:
                continue
            value = per_meal[macro]
            food, text, alt_text = food_suggestions(category, value)
            macros = {'protein': Decimal('0'), 'carbs': Decimal('0'), 'fat': Decimal('0')}
            macros[macro] = value
            items.append({
                'food_category': category,
                'food_item': food,
                'primary_food_text': text,
                'alternatives_text': alt_text,
                'target_protein': macros['protein'],
                'target_carbs': macros['carbs'],
                'target_fat': macros['fat'],
                'target_calories': macros['protein'] * 4 + macros['carbs'] * 4 + macros['fat'] * 9,
            })
        meals.append({
            'name': _("Bữa %(n)s") % {'n': index + 1},
            'sort_order': index,
            'target_protein': per_meal['protein'],
            'target_carbs': per_meal['carbs'],
            'target_fat': per_meal['fat'],
            'target_calories': (phase.target_calories / count).quantize(Decimal('1')),
            'items': items,
        })
    return save_plan(phase, notes=_("Thực đơn gợi ý chia đều %(n)s bữa theo macro mục tiêu.") % {'n': meal_count}, meals=meals)
