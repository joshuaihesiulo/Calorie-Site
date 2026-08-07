# app/services/providers.py
import os
from groq import AsyncGroq
from app.services.vision import identify_dishes as gemini_identify

groq_client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])

async def identify_dishes_with_fallback(base64_image: str) -> dict:
    try:
        return await gemini_identify(base64_image)
    except Exception as gemini_err:
        # Groq vision models are limited — llama-3.2-90b-vision-preview class models
        # Check Groq's current model list, these names change
        try:
            return await groq_identify(base64_image)
        except Exception as groq_err:
            raise Exception(f"All providers failed. Gemini: {gemini_err}, Groq: {groq_err}")