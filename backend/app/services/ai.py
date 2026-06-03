import os
import json
import google.generativeai as genai
from typing import Dict, Any, Optional
from app.core.config import settings

def get_gemini_client() -> Optional[genai.GenerativeModel]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None
    
    genai.configure(api_key=api_key)
    # Using gemini-2.5-flash as it's fast and supports JSON response
    model = genai.GenerativeModel(
        'gemini-2.5-flash',
        generation_config={"response_mime_type": "application/json"}
    )
    return model

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
            response = model.generate_content(prompt)
            return json.loads(response.text)
        except Exception as e:
            raise RuntimeError(f"Lỗi khi gọi AI: {str(e)}")
