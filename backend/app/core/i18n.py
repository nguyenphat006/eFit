import json
import os
from typing import Dict, Any

class Translator:
    def __init__(self, locale: str = "vi"):
        self.locale = "vi" if locale.startswith("vi") else "en"
        self.translations: Dict[str, str] = {}
        self.load_translations()

    def load_translations(self) -> None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        locale_path = os.path.join(base_dir, "locales", f"{self.locale}.json")
        
        try:
            if os.path.exists(locale_path):
                with open(locale_path, "r", encoding="utf-8") as f:
                    self.translations = json.load(f)
            else:
                self.translations = {}
        except Exception as e:
            # Fallback to empty translations in case of error
            self.translations = {}

    def translate(self, key: str) -> str:
        return self.translations.get(key, key)

def get_translator(accept_language: str = "vi") -> Any:
    locale = "vi"
    if accept_language:
        # Standard Accept-Language: "en-US,en;q=0.9,vi;q=0.8"
        first_lang = accept_language.split(",")[0].split("-")[0].lower()
        if first_lang in ["en", "vi"]:
            locale = first_lang
            
    translator = Translator(locale)
    return translator.translate
