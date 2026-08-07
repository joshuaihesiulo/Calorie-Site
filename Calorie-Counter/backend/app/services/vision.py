import os
import re
import json
import base64
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from environment variables.")

genai.configure(api_key=api_key)

IDENTIFY_PROMPT = """Look at this plate of Nigerian/West African food carefully.
List EVERY visually distinct dish on the plate separately — do not merge them into one.
For example, if you see a swallow (amala, eba, pounded yam, etc.) served with a soup (egusi, ewedu, ogbono, etc.), list them as TWO separate dishes, not one.

For each dish, use one of these exact keys if it matches: jollof_rice, egusi_soup, pounded_yam, amala, fried_plantain, moin_moin.
If a dish doesn't match any of those, give your best plain lowercase dish name with underscores instead (e.g. "ewedu_soup").

Return ONLY raw JSON, no markdown, no backticks, in this exact shape:
{
  "dishes": [
    { "dishKey": "amala", "displayName": "Amala", "estimatedGrams": 200 },
    { "dishKey": "egusi_soup", "displayName": "Egusi Soup", "estimatedGrams": 300 }
  ]
}"""


async def generate_with_retry(model, parts, max_retries=3):
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            return await model.generate_content_async(parts)
        except Exception as err:
            last_error = err
            msg = str(err)
            is_503 = "503" in msg or "overloaded" in msg or "high demand" in msg
            if not is_503 or attempt == max_retries:
                raise
            await asyncio.sleep(2 ** attempt)
    raise last_error


async def identify_dishes(base64_image: str) -> dict:
    match = re.match(r"^data:(image/\w+);base64,(.+)$", base64_image)
    mime_type = match.group(1) if match else "image/jpeg"
    raw_base64 = match.group(2) if match else base64_image

    model = genai.GenerativeModel("gemini-1.5-flash")  # note: fixed model name, see caveat below
    image_part = {"mime_type": mime_type, "data": base64.b64decode(raw_base64)}

    result = await generate_with_retry(model, [IDENTIFY_PROMPT, image_part])
    clean_json = re.sub(r"```json|```", "", result.text, flags=re.I).strip()
    return json.loads(clean_json)