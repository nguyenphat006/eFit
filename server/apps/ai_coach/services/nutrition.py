"""
Gợi ý dinh dưỡng bằng AI (Gemini), tự rơi về tính toán offline khi chưa cấu hình khóa hoặc gọi AI lỗi.

- `suggest_nutrition(profile, goal, phase_description)` -> mục tiêu macro / ngày + giải thích (Markdown).
- `generate_meal_plan(calories, protein, carbs, fat)` -> 3 bữa, mỗi bữa có các món theo mã nhóm thực phẩm.
  Phân hệ Mùa giải dùng hàm này để lưu thực đơn (NutritionPlan / Meal / MealItem).
Mỗi kết quả có `source`: 'ai' | 'offline'.
"""
from . import gemini

FOOD_CATEGORY_CODES = ['MEATS', 'SEAFOOD', 'GRAINS', 'FATS', 'VEGETABLES', 'DAIRY_EGGS', 'SUPPLEMENTS', 'RECIPE']
GOAL_LABELS = {
    'BULKING': 'Tăng cơ (Bulking)',
    'CUTTING': 'Giảm mỡ (Cutting)',
    'MAINTAINING': 'Duy trì (Maintaining)',
    'RECOMP': 'Tái cấu trúc cơ thể (Recomp)',
}


def _to_float(value, default):
    try:
        return float(value) if value not in (None, '') else default
    except (TypeError, ValueError):
        return default


def _is_female(gender) -> bool:
    g = str(gender or '').lower()
    return g in ('female', 'nữ', 'nu') or 'female' in g


# ------------------------------------------------------------------ gợi ý macro
def _suggest_prompt(profile: dict, goal: str, phase_description: str) -> str:
    return f"""
Bạn là "eFit AI" - trợ lý dinh dưỡng thể hình của ứng dụng eFit.
Phân tích dữ liệu người tập và gợi ý lượng Macros mỗi ngày cho giai đoạn này. Xưng hô là "eFit AI".

Thông tin người tập:
- Giới tính: {profile.get('gender') or 'Không rõ'}
- Tuổi: {profile.get('age') or 'Không rõ'}
- Chiều cao: {profile.get('height') or 'Không rõ'} cm
- Cân nặng hiện tại: {profile.get('current_weight') or 'Không rõ'} kg
- Tỷ lệ mỡ: {profile.get('body_fat_percentage') or 'Không rõ'} %
- Hệ số vận động (1.2 - 1.9): {profile.get('activity_level') or 'Không rõ'}
- Mục tiêu chung: {GOAL_LABELS.get(goal, goal)}

Giai đoạn tập luyện: {phase_description or 'Không mô tả'}

LƯU Ý CHUYÊN MÔN: mục tiêu Bulking nhưng tỷ lệ mỡ cao (Nam > 20%, Nữ > 28%) -> đề xuất calo duy trì hoặc thâm hụt
nhẹ (Recomp / Lean Bulk) và giải thích lý do trong "explanation".

Chỉ trả JSON đúng cấu trúc:
{{"calories": số nguyên, "protein": số nguyên (g), "carbs": số nguyên (g), "fat": số nguyên (g),
  "explanation": "giải thích tiếng Việt, định dạng Markdown"}}
"""


def _offline_suggestion(profile: dict, goal: str) -> dict:
    female = _is_female(profile.get('gender'))
    age = int(_to_float(profile.get('age'), 25))
    height = _to_float(profile.get('height'), 170)
    weight = _to_float(profile.get('current_weight'), 70)
    body_fat = _to_float(profile.get('body_fat_percentage'), 15)
    activity = _to_float(profile.get('activity_level'), 1.375)

    # BMR Mifflin-St Jeor
    bmr = 10 * weight + 6.25 * height - 5 * age + (-161 if female else 5)
    tdee = bmr * activity
    goal_key = str(goal or '').upper()
    is_bulking = goal_key == 'BULKING' or 'bulk' in goal_key.lower()
    is_cutting = goal_key == 'CUTTING' or 'cut' in goal_key.lower()
    high_fat = body_fat > (28 if female else 20)

    if is_bulking and high_fat:
        calories, strategy = tdee - 100, "Body Recomposition (tối ưu tỷ lệ cơ / mỡ)"
        reason = ("Tỷ lệ mỡ hiện tại khá cao, tăng calo nhiều dễ tích thêm mỡ và gây kháng insulin. "
                  "eFit AI đề xuất thâm hụt nhẹ để vừa giảm mỡ vừa xây cơ.")
    elif is_bulking:
        calories, strategy = tdee + 300, "Lean Bulking (tăng cơ, hạn chế mỡ thừa)"
        reason = "Thặng dư vừa phải (+300 kcal) tối ưu tổng hợp cơ mà không tích nhiều mỡ."
    elif is_cutting:
        calories, strategy = tdee - 500, "Cutting (giảm mỡ giữ cơ)"
        reason = "Thâm hụt 500 kcal / ngày giúp giảm khoảng 0.5 kg / tuần, đạm cao để giữ cơ."
    else:
        calories, strategy = tdee, "Maintenance (duy trì thể trạng)"
        reason = "Calo duy trì giúp cân bằng năng lượng, giữ cân nặng ổn định và cải thiện chất lượng tập."

    calories = max(1200, int(calories))
    protein = max(60, int(weight * (2.2 if is_cutting else 2.0 if is_bulking else 1.8)))
    fat = max(30, int(calories * 0.25 / 9))
    carbs = max(50, int((calories - protein * 4 - fat * 9) / 4))
    calories = protein * 4 + carbs * 4 + fat * 9

    explanation = (
        "### Phân tích dinh dưỡng từ **eFit AI** (chế độ offline)\n\n"
        f"- **Chiến lược đề xuất:** **{strategy}**\n"
        f"- **Giải thích:** {reason}\n"
        "- **Lưu ý:**\n"
        "  * Uống 2-3 lít nước mỗi ngày.\n"
        "  * Chia đều đạm qua các bữa để hấp thụ tốt hơn.\n"
        "  * Ngủ 7-8 tiếng / ngày để phục hồi cơ và hệ thần kinh trung ương.\n"
    )
    return {'calories': calories, 'protein': protein, 'carbs': carbs, 'fat': fat, 'explanation': explanation}


def suggest_nutrition(profile: dict, goal: str, phase_description: str = '') -> dict:
    if gemini.is_configured():
        try:
            result = gemini.generate_json(_suggest_prompt(profile, goal, phase_description))
            return {
                'calories': int(result['calories']), 'protein': int(result['protein']),
                'carbs': int(result['carbs']), 'fat': int(result['fat']),
                'explanation': str(result.get('explanation') or ''), 'source': 'ai',
            }
        except (gemini.AIProviderError, KeyError, TypeError, ValueError):
            pass
    return {**_offline_suggestion(profile, goal), 'source': 'offline'}


# -------------------------------------------------------------------- thực đơn
def _meal_plan_prompt(calories: int, protein: int, carbs: int, fat: int) -> str:
    codes = ', '.join(f'"{c}"' for c in FOOD_CATEGORY_CODES)
    return f"""
Bạn là chuyên gia dinh dưỡng thể hình eFit. Chia macros mục tiêu / ngày thành 3 bữa ăn hợp lý.
Mục tiêu: {calories} kcal, đạm {protein}g, tinh bột {carbs}g, chất béo {fat}g.
Quy tắc: tổng 3 bữa sai số tối đa 5%; mỗi bữa có danh sách món (items); mỗi món ghi food_category_code
CHỈ trong: {codes}; tổng macro các món bằng mục tiêu của bữa.
Chỉ trả JSON:
{{"notes": "lời khuyên ngắn", "meals": [{{"name": "...", "target_calories": int, "target_protein": int,
  "target_carbs": int, "target_fat": int, "items": [{{"food_category_code": "...", "target_protein": int,
  "target_carbs": int, "target_fat": int}}]}}]}}
"""


def _split(total: int, ratios: list[float]) -> list[int]:
    """Chia số nguyên theo tỷ lệ, phần dư dồn vào phần cuối (tổng giữ nguyên)."""
    parts = [int(total * r) for r in ratios[:-1]]
    parts.append(max(0, total - sum(parts)))
    return parts


def _item(code, p, c, f):
    return {'food_category_code': code, 'target_protein': p, 'target_carbs': c, 'target_fat': f}


def _offline_meal_plan(calories: int, protein: int, carbs: int, fat: int) -> dict:
    templates = [
        ("Bữa sáng (sáng sớm & trước tập)", [('DAIRY_EGGS', .5, .1, .6), ('GRAINS', .2, .8, .2), ('SUPPLEMENTS', .3, .1, .2)]),
        ("Bữa trưa (phục hồi sau tập)", [('MEATS', .7, 0, .5), ('GRAINS', .1, .8, .2), ('VEGETABLES', .2, .2, .3)]),
        ("Bữa tối (dinh dưỡng ban đêm)", [('SEAFOOD', .6, 0, .4), ('GRAINS', .15, .7, .2), ('VEGETABLES', .25, .3, .4)]),
    ]
    p_meals, c_meals, f_meals = (_split(v, [.3, .4, .3]) for v in (protein, carbs, fat))
    meals = []
    for idx, (name, items) in enumerate(templates):
        p, c, f = p_meals[idx], c_meals[idx], f_meals[idx]
        ps = _split(p, [i[1] for i in items])
        cs = _split(c, [i[2] for i in items])
        fs = _split(f, [i[3] for i in items])
        meals.append({
            'name': name, 'target_calories': p * 4 + c * 4 + f * 9,
            'target_protein': p, 'target_carbs': c, 'target_fat': f,
            'items': [_item(code, ps[i], cs[i], fs[i]) for i, (code, *_) in enumerate(items)],
        })
    notes = ("Thực đơn được eFit AI lập tự động (chế độ offline). Các bữa nên cách nhau 3-4 tiếng "
             "để hấp thụ dinh dưỡng tốt nhất.")
    return {'notes': notes, 'meals': meals}


def generate_meal_plan(calories, protein, carbs, fat) -> dict:
    calories, protein, carbs, fat = (int(round(float(v))) for v in (calories, protein, carbs, fat))
    if gemini.is_configured():
        try:
            result = gemini.generate_json(_meal_plan_prompt(calories, protein, carbs, fat))
            meals = result['meals']
            if isinstance(meals, list) and meals:
                for meal in meals:
                    meal['items'] = [i for i in meal.get('items', []) if i.get('food_category_code') in FOOD_CATEGORY_CODES]
                return {'notes': str(result.get('notes') or ''), 'meals': meals, 'source': 'ai'}
        except (gemini.AIProviderError, KeyError, TypeError, ValueError):
            pass
    return {**_offline_meal_plan(calories, protein, carbs, fat), 'source': 'offline'}
