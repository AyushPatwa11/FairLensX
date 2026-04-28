import os
import json
import requests

# Prefer full model resource names as returned by the ListModels API
MODEL_CANDIDATES = [
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-lite",
    "models/gemini-2.5-flash",
    "models/gemini-2.5-pro",
    "models/gemini-2.5-flash-lite",
    "models/gemini-2.0-flash-001",
    "models/gemini-2.0-flash-lite-001",
]


class SimpleResponse:
    def __init__(self, content: str):
        self.content = content


class GenAIWrapper:
    def __init__(self, candidates=None, temperature=0.2, max_output_tokens=512):
        self.candidates = candidates or MODEL_CANDIDATES
        self.temperature = temperature
        self.max_output_tokens = max_output_tokens

    def _make_payload(self, text: str):
        # Use correct generateContent payload for Google Generative AI API
        return {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": text}]
                }
            ],
            "generationConfig": {
                "temperature": float(self.temperature),
                "maxOutputTokens": int(self.max_output_tokens)
            }
        }

    def _extract_text_from_json(self, obj):
        # Recursively find the first reasonable string in nested response bodies
        if obj is None:
            return None
        if isinstance(obj, str):
            return obj
        if isinstance(obj, dict):
            for k, v in obj.items():
                res = self._extract_text_from_json(v)
                if res:
                    return res
        if isinstance(obj, list):
            for item in obj:
                res = self._extract_text_from_json(item)
                if res:
                    return res
        return None

    def invoke(self, input_data, **kwargs):
        # Accept either a raw string or a list of message objects
        if isinstance(input_data, str):
            text = input_data
        else:
            # Try to extract text from LangChain message objects
            try:
                if isinstance(input_data, (list, tuple)):
                    parts = []
                    for m in input_data:
                        # message objects used elsewhere expose 'content'
                        c = getattr(m, 'content', None)
                        if c:
                            parts.append(str(c))
                    text = "\n".join(parts)
                else:
                    text = str(input_data)
            except Exception:
                text = str(input_data)

        last_exc = None
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY not set in environment")

        for model in self.candidates:
            try:
                url = f"https://generativelanguage.googleapis.com/v1/{model}:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}
                payload = self._make_payload(text)
                resp = requests.post(url, headers=headers, data=json.dumps(payload), timeout=30)
                if resp.status_code == 200:
                    body = resp.json()
                    # Extract text from Gemini API response: candidates[0].content.parts[0].text
                    try:
                        candidates = body.get("candidates", [])
                        if candidates and len(candidates) > 0:
                            content_obj = candidates[0].get("content", {})
                            parts = content_obj.get("parts", [])
                            if parts and len(parts) > 0:
                                text_content = parts[0].get("text", "")
                                if text_content:
                                    return SimpleResponse(content=str(text_content))
                    except (KeyError, IndexError, TypeError):
                        pass
                    # Fallback: try recursive extraction
                    content = self._extract_text_from_json(body)
                    if not content:
                        content = resp.text
                    return SimpleResponse(content=str(content))
                else:
                    # If model isn't found, server often returns 404/400 with hint
                    last_exc = RuntimeError(f"Model {model} failed: {resp.status_code} {resp.text}")
                    msg = resp.text.lower() if resp.text else ''
                    if 'not found' in msg or '404' in msg:
                        continue
                    # Other HTTP errors - raise to surface the problem
                    raise last_exc
            except Exception as e:
                last_exc = e
                # try next candidate for not-found style errors
                msg = str(e).lower()
                if 'not found' in msg or '404' in msg:
                    continue
                # For other errors, re-raise
                raise

        if last_exc:
            raise last_exc
        raise RuntimeError("No LLM candidates configured")


def get_llm_wrapper(temperature=0.2, max_output_tokens=4096):
    # Load API key from environment if present; assume .env is loaded elsewhere
    key = os.getenv("GOOGLE_API_KEY")
    if not key or key == "your_gemini_api_key_here":
        return None
    return GenAIWrapper(temperature=temperature, max_output_tokens=max_output_tokens)
