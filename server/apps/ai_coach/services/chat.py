"""Hỏi đáp tự do với eFit AI — cần GEMINI_API_KEY (không có chế độ offline cho câu hỏi tự do)."""
from django.utils.translation import gettext as _

from apps.core.exceptions import BusinessError

from . import gemini

MAX_HISTORY = 10

SYSTEM_PROMPT = (
    'Bạn là "eFit AI" - trợ lý huấn luyện thể hình & dinh dưỡng của ứng dụng eFit. '
    'Trả lời bằng tiếng Việt, ngắn gọn, chính xác, dùng Markdown (tiêu đề, gạch đầu dòng) khi phù hợp. '
    'Không chẩn đoán bệnh; với vấn đề y tế, khuyên người dùng gặp bác sĩ.'
)


def build_prompt(question: str, history: list[dict], context: str = '') -> str:
    lines = [SYSTEM_PROMPT]
    if context:
        lines.append(f"Bối cảnh người tập:\n{context}")
    for turn in history[-MAX_HISTORY:]:
        speaker = 'Người dùng' if turn.get('role') == 'user' else 'eFit AI'
        lines.append(f"{speaker}: {turn.get('content', '')}")
    lines.append(f"Người dùng: {question}")
    lines.append('eFit AI:')
    return '\n\n'.join(lines)


def ask(question: str, history: list[dict] | None = None, context: str = '') -> str:
    if not gemini.is_configured():
        raise BusinessError(_("Trợ lý AI chưa được cấu hình (thiếu GEMINI_API_KEY). Liên hệ quản trị viên."))
    try:
        answer = gemini.generate_text(build_prompt(question, history or [], context))
    except gemini.AIProviderError:
        raise BusinessError(_("Trợ lý AI tạm thời không phản hồi, vui lòng thử lại sau."))
    if not answer:
        raise BusinessError(_("Trợ lý AI không trả lời được câu hỏi này, hãy diễn đạt lại."))
    return answer
