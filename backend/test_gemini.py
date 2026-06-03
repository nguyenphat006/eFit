import os
import asyncio
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: {bool(api_key)}")

import google.generativeai as genai
genai.configure(api_key=api_key)

model = genai.GenerativeModel(
    'gemini-1.5-flash',
    generation_config={"response_mime_type": "application/json"}
)

async def test():
    try:
        response = await model.generate_content_async("What is 1+1? Return JSON: {\"answer\": 2}")
        print("Response:", response.text)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
