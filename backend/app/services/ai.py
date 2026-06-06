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
        based on the user's profile and goal.
        """
        model = get_gemini_client()
        if not model:
            raise ValueError("GEMINI_API_KEY is not set.")

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
            raise RuntimeError(f"Lỗi khi gọi AI: {str(e)}")

    @staticmethod
    def generate_meal_plan(target_calories: int, target_protein: int, target_carbs: int, target_fat: int) -> Dict[str, Any]:
        """
        Calls Gemini to generate a meal plan with 3 meals based on the target macros.
        """
        model = get_gemini_client()
        if not model:
            raise ValueError("GEMINI_API_KEY is not set.")

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
            raise RuntimeError(f"Lỗi khi gọi AI sinh thực đơn: {str(e)}")
