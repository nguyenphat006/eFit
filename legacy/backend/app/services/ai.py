import os
import json
from google import genai
from typing import Dict, Any, Optional
from app.core.config import settings

def get_gemini_client() -> Optional[genai.Client]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None
    
    client = genai.Client(api_key=api_key)
    return client

class AIService:
    @staticmethod
    def suggest_nutrition(profile: Dict[str, Any], goal: str, phase_desc: str) -> Dict[str, Any]:
        """
        Calls Gemini to suggest nutrition targets (Calories, Protein, Carbs, Fat)
        based on the user's profile and goal. Falls back to programmatic calculations
        if the API key is not set or the call fails.
        """
        model = get_gemini_client()
        if model:
            prompt = f"""
        Bạn là "eFit AI" - trợ lý dinh dưỡng thể hình cao cấp độc quyền của ứng dụng eFit.
        Hãy phân tích dữ liệu sau của một người tập và đưa ra gợi ý lượng Macros (Dinh dưỡng) mỗi ngày cho họ trong giai đoạn (Phase) này. Khi giải thích, hãy xưng hô là "eFit AI" một cách chuyên nghiệp.
        
        Thông tin người tập:
        - Giới tính: {profile.get('gender', 'Không rõ')}
        - Tuổi: {profile.get('age', 'Không rõ')} tuổi
        - Chiều cao: {profile.get('height', 'Không rõ')} cm
        - Cân nặng hiện tại: {profile.get('current_weight', 'Không rõ')} kg
        - Tỷ lệ mỡ (Body Fat): {profile.get('body_fat_percentage', 'Không rõ')} %
        - Mức độ vận động (Activity Level: 1.2 - 1.9): {profile.get('activity_level', 'Không rõ')}
        - Mục tiêu chung: {goal}
        
        Thông tin giai đoạn tập luyện (Phase):
        - Mô tả: {phase_desc}
        
        LƯU Ý CHUYÊN MÔN:
        Nếu người dùng có mục tiêu chung là "Bulking" (Tăng cân/Tăng cơ) NHƯNG tỷ lệ mỡ (Body Fat) hiện tại đang ở mức cao (ví dụ Nam > 20%, Nữ > 28%), bạn PHẢI tự động điều chỉnh chiến lược. Thay vì dư thừa calo nhiều (dirty bulk), hãy đề xuất một mức calo duy trì hoặc thâm hụt rất nhẹ (Body Recomposition / Lean Bulk). Hãy giải thích rõ lý do chuyên môn (như nguy cơ tích mỡ thêm, kháng insulin) trong phần "explanation" để người dùng hiểu.
        
        YÊU CẦU:
        Trả về kết quả dưới định dạng JSON (chỉ có JSON, không có markdown block bao ngoài), với cấu trúc chính xác như sau:
        {{
            "calories": (số nguyên, lượng calo mỗi ngày),
            "protein": (số nguyên, lượng protein tính bằng gram),
            "carbs": (số nguyên, lượng carbs tính bằng gram),
            "fat": (số nguyên, lượng fat tính bằng gram),
            "explanation": (chuỗi string, giải thích bằng tiếng Việt lý do bạn chọn mức này. LƯU Ý: Hãy sử dụng định dạng Markdown phong phú (in đậm, in nghiêng, bullet points) bên trong chuỗi này để trình bày phân tích thật đẹp mắt và dễ đọc)
        }}
        """
            try:
                response = model.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )
                text = response.text
                if text.startswith("```json"):
                    text = text.split("```json")[1].split("```")[0].strip()
                elif text.startswith("```"):
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)
            except Exception as e:
                # Fall through to programmatic calculation on failure
                print(f"Warning: AIService.suggest_nutrition API call failed, falling back to programmatic mock: {e}")

        # Programmatic Fallback calculation
        gender = str(profile.get('gender') or 'Male').lower()
        
        try:
            age = int(profile.get('age') or 25)
        except (ValueError, TypeError):
            age = 25
            
        try:
            height = float(profile.get('height') or 170)
        except (ValueError, TypeError):
            height = 170
            
        try:
            weight = float(profile.get('current_weight') or 70)
        except (ValueError, TypeError):
            weight = 70
            
        try:
            body_fat = float(profile.get('body_fat_percentage') or 15)
        except (ValueError, TypeError):
            body_fat = 15
            
        try:
            activity_level = float(profile.get('activity_level') or 1.375)
        except (ValueError, TypeError):
            activity_level = 1.375

        # BMR calculation using Harris-Benedict (Revised)
        if 'female' in gender or 'nữ' in gender:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age + 5

        tdee = bmr * activity_level
        
        # Adjust calories based on goal
        goal_lower = str(goal or '').lower()
        is_bulking = 'bulk' in goal_lower or 'tăng' in goal_lower
        is_cutting = 'cut' in goal_lower or 'giảm' in goal_lower
        
        is_high_fat = False
        if ('female' in gender or 'nữ' in gender) and body_fat > 28:
            is_high_fat = True
        elif ('female' not in gender and 'nữ' not in gender) and body_fat > 20:
            is_high_fat = True

        if is_bulking:
            if is_high_fat:
                calories = tdee - 100
                strategy = "Body Recomposition (tối ưu hóa tỷ lệ cơ/mỡ)"
                reason = "Do tỷ lệ mỡ cơ thể hiện tại khá cao, việc tăng calo quá nhiều (Bulking thông thường) sẽ dễ tích lũy thêm mỡ thừa và gây kháng insulin. eFit AI đề xuất mức calo thâm hụt nhẹ để vừa giảm mỡ vừa xây dựng cơ bắp hiệu quả."
            else:
                calories = tdee + 300
                strategy = "Lean Bulking (Tăng cơ giảm mỡ thừa)"
                reason = "Mức năng lượng thặng dư vừa phải (+300 kcal) giúp tối ưu hóa tổng hợp cơ bắp mới mà không tích lũy quá nhiều mỡ thừa."
        elif is_cutting:
            calories = tdee - 500
            strategy = "Cutting (Giảm mỡ giữ cơ)"
            reason = "Thâm hụt 500 kcal mỗi ngày giúp bạn giảm mỡ cơ thể một cách an toàn và bền vững (khoảng 0.5kg mỗi tuần) trong khi vẫn duy trì được khối lượng cơ nạc tối đa nhờ lượng protein cao."
        else:
            calories = tdee
            strategy = "Maintenance (Duy trì thể trạng)"
            reason = "Mức calo duy trì giúp bạn cân bằng năng lượng nạp vào và tiêu hao, thích hợp cho việc giữ cân nặng ổn định và cải thiện chất lượng tập luyện."

        calories = max(1200, int(calories))

        if is_cutting:
            protein_multiplier = 2.2
        elif is_bulking:
            protein_multiplier = 2.0
        else:
            protein_multiplier = 1.8
            
        protein = int(weight * protein_multiplier)
        protein = max(60, protein)

        fat_pct = 0.25
        fat = int((calories * fat_pct) / 9)
        fat = max(30, fat)

        carbs_cal = calories - (protein * 4) - (fat * 9)
        carbs = int(carbs_cal / 4)
        carbs = max(50, carbs)

        calories = protein * 4 + carbs * 4 + fat * 9

        explanation = f"""### 🌟 Phân Tích Dinh Dưỡng Từ **eFit AI** (Chế độ offline)

Chào bạn, dựa trên các thông số cơ thể và mục tiêu của bạn, **eFit AI** đã lập kế hoạch dinh dưỡng tối ưu:

- **Chiến lược đề xuất:** **{strategy}**
- **Giải thích chuyên môn:**
  {reason}
- **Lưu ý tập luyện & sinh hoạt:**
  * Hãy cố gắng uống đủ từ 2-3 lít nước mỗi ngày.
  * Phân bổ lượng đạm (Protein) trải đều qua các bữa ăn chính và phụ để tối ưu hóa khả năng hấp thụ.
  * Ngủ đủ giấc (7-8 tiếng/ngày) đóng vai trò quyết định đến sự phục hồi của cơ bắp và hệ thần kinh trung ương (CNS).
"""
        return {
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fat": fat,
            "explanation": explanation
        }

    @staticmethod
    def generate_meal_plan(target_calories: int, target_protein: int, target_carbs: int, target_fat: int) -> Dict[str, Any]:
        """
        Calls Gemini to generate a meal plan with 3 meals based on the target macros.
        Falls back to programmatic generation if the API key is not set or the call fails.
        """
        model = get_gemini_client()
        if model:
            prompt = f"""
        Bạn là chuyên gia dinh dưỡng thể hình eFit. Hãy chia nhỏ số lượng Macros mục tiêu sau đây thành 3 bữa ăn hợp lý (Meal 1, Meal 2, Meal 3).
        Mục tiêu hằng ngày:
        - Calories: {target_calories} kcal
        - Protein: {target_protein}g
        - Carbs: {target_carbs}g
        - Fat: {target_fat}g
        
        Quy tắc:
        1. Tổng lượng calories, protein, carbs, fat của 3 bữa phải gần bằng (sai số tối đa 5%) với mục tiêu hằng ngày.
        2. Mỗi bữa ăn phải chứa một danh sách các nguyên liệu (items).
        3. Với mỗi nguyên liệu, phải chỉ định rõ Category Code. 
           CHỈ SỬ DỤNG các Category Code sau đây:
           - "MEATS": Các loại thịt (bò, gà, lợn,...)
           - "SEAFOOD": Hải sản, cá,...
           - "GRAINS": Tinh bột, cơm, khoai, yến mạch,...
           - "FATS": Dầu, mỡ, các loại hạt,...
           - "VEGETABLES": Rau xanh, củ quả, trái cây...
           - "DAIRY_EGGS": Sữa, phô mai, sữa chua, trứng...
           - "SUPPLEMENTS": Whey, mass...
           - "RECIPE": Các món ăn tổng hợp
        4. Mỗi nguyên liệu phải có lượng macros (protein, carbs, fat) cụ thể. Tổng macros của các nguyên liệu trong 1 bữa phải bằng mục tiêu của bữa đó.
        
        Trả về kết quả dưới định dạng JSON (chỉ có JSON, không có markdown block bao ngoài), với cấu trúc chính xác như sau:
        {{
            "notes": "Lời khuyên ngắn gọn...",
            "meals": [
                {{
                    "name": "Tên bữa ăn (VD: Bữa sáng)",
                    "target_calories": (số nguyên),
                    "target_protein": (số nguyên),
                    "target_carbs": (số nguyên),
                    "target_fat": (số nguyên),
                    "items": [
                        {{
                            "food_category_code": "Mã category (VD: GRAINS)",
                            "target_protein": (số nguyên),
                            "target_carbs": (số nguyên),
                            "target_fat": (số nguyên)
                        }}
                    ]
                }}
            ]
        }}
        """
            try:
                response = model.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )
                text = response.text
                if text.startswith("```json"):
                    text = text.split("```json")[1].split("```")[0].strip()
                elif text.startswith("```"):
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)
            except Exception as e:
                # Fall through to programmatic calculation on failure
                print(f"Warning: AIService.generate_meal_plan API call failed, falling back to programmatic mock: {e}")

        # Programmatic Fallback logic
        # Distribute macros: 30% Breakfast, 40% Lunch, 30% Dinner
        p_b = int(target_protein * 0.3)
        c_b = int(target_carbs * 0.3)
        f_b = int(target_fat * 0.3)
        cal_b = p_b * 4 + c_b * 4 + f_b * 9

        p_l = int(target_protein * 0.4)
        c_l = int(target_carbs * 0.4)
        f_l = int(target_fat * 0.4)
        cal_l = p_l * 4 + c_l * 4 + f_l * 9

        p_d = max(0, target_protein - p_b - p_l)
        c_d = max(0, target_carbs - c_b - c_l)
        f_d = max(0, target_fat - f_b - f_l)
        cal_d = p_d * 4 + c_d * 4 + f_d * 9

        meals = [
            {
                "name": "Bữa sáng (Sáng sớm & Trước tập)",
                "target_calories": cal_b,
                "target_protein": p_b,
                "target_carbs": c_b,
                "target_fat": f_b,
                "items": [
                    {
                        "food_category_code": "DAIRY_EGGS",
                        "target_protein": int(p_b * 0.5),
                        "target_carbs": int(c_b * 0.1),
                        "target_fat": int(f_b * 0.6)
                    },
                    {
                        "food_category_code": "GRAINS",
                        "target_protein": int(p_b * 0.2),
                        "target_carbs": int(c_b * 0.8),
                        "target_fat": int(f_b * 0.2)
                    },
                    {
                        "food_category_code": "SUPPLEMENTS",
                        "target_protein": max(0, p_b - int(p_b * 0.5) - int(p_b * 0.2)),
                        "target_carbs": max(0, c_b - int(c_b * 0.1) - int(c_b * 0.8)),
                        "target_fat": max(0, f_b - int(f_b * 0.6) - int(f_b * 0.2))
                    }
                ]
            },
            {
                "name": "Bữa trưa (Phục hồi sau tập)",
                "target_calories": cal_l,
                "target_protein": p_l,
                "target_carbs": c_l,
                "target_fat": f_l,
                "items": [
                    {
                        "food_category_code": "MEATS",
                        "target_protein": int(p_l * 0.7),
                        "target_carbs": int(c_l * 0.0),
                        "target_fat": int(f_l * 0.5)
                    },
                    {
                        "food_category_code": "GRAINS",
                        "target_protein": int(p_l * 0.1),
                        "target_carbs": int(c_l * 0.8),
                        "target_fat": int(f_l * 0.2)
                    },
                    {
                        "food_category_code": "VEGETABLES",
                        "target_protein": max(0, p_l - int(p_l * 0.7) - int(p_l * 0.1)),
                        "target_carbs": max(0, c_l - int(c_l * 0.0) - int(c_l * 0.8)),
                        "target_fat": max(0, f_l - int(f_l * 0.5) - int(f_l * 0.2))
                    }
                ]
            },
            {
                "name": "Bữa tối (Dinh dưỡng ban đêm)",
                "target_calories": cal_d,
                "target_protein": p_d,
                "target_carbs": c_d,
                "target_fat": f_d,
                "items": [
                    {
                        "food_category_code": "SEAFOOD",
                        "target_protein": int(p_d * 0.6),
                        "target_carbs": int(c_d * 0.0),
                        "target_fat": int(f_d * 0.4)
                    },
                    {
                        "food_category_code": "GRAINS",
                        "target_protein": int(p_d * 0.15),
                        "target_carbs": int(c_d * 0.7),
                        "target_fat": int(f_d * 0.2)
                    },
                    {
                        "food_category_code": "VEGETABLES",
                        "target_protein": max(0, p_d - int(p_d * 0.6) - int(p_d * 0.15)),
                        "target_carbs": max(0, c_d - int(c_d * 0.0) - int(c_d * 0.7)),
                        "target_fat": max(0, f_d - int(f_d * 0.4) - int(f_d * 0.2))
                    }
                ]
            }
        ]

        notes = (
            "Giáo án dinh dưỡng được thiết kế tự động bởi eFit AI (Chế độ offline). "
            "Hãy đảm bảo phân bổ hợp lý thời gian giữa các bữa ăn (cách nhau khoảng 3-4 tiếng) "
            "để tối đa hóa hiệu suất hấp thụ dinh dưỡng."
        )

        return {
            "notes": notes,
            "meals": meals
        }
