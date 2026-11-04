"""
Kết nối Google Gemini. Không có GEMINI_API_KEY -> `is_configured()` = False; nơi gọi tự chọn tính toán offline
hoặc báo lỗi nghiệp vụ. Test mock `generate_text` / `generate_json` của module này.
"""
import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


class AIProviderError(Exception):
    """Gọi nhà cung cấp AI thất bại (mạng, quota, trả sai định dạng)."""


def is_configured() -> bool:
    return bool(getattr(settings, 'GEMINI_API_KEY', None))


def _client():
    from google import genai  # import muộn: chỉ cần thư viện khi thật sự gọi AI

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _strip_fence(text: str) -> str:
    text = (text or '').strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1] if '\n' in text else ''
        text = text.rsplit('```', 1)[0]
    return text.strip()


def generate_text(prompt: str) -> str:
    try:
        response = _client().models.generate_content(model=settings.GEMINI_MODEL, contents=prompt)
        return (response.text or '').strip()
    except Exception as exc:  # thư viện ném nhiều loại lỗi khác nhau
        logger.warning("Gemini generate_text thất bại: %s", exc)
        raise AIProviderError(str(exc)) from exc


def generate_json(prompt: str) -> dict:
    from google import genai

    try:
        response = _client().models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=genai.types.GenerateContentConfig(response_mime_type='application/json'),
        )
        return json.loads(_strip_fence(response.text))
    except Exception as exc:
        logger.warning("Gemini generate_json thất bại: %s", exc)
        raise AIProviderError(str(exc)) from exc
