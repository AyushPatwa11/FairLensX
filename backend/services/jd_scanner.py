import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

def scan(text: str):
    if not os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY") == "your_gemini_api_key_here":
        return {
            "success": False,
            "error": "Please set GOOGLE_API_KEY in backend/.env to use the AI Scanner.",
            "processed_text": text,
            "suggestions": [],
            "gender_count": 0,
            "age_count": 0,
            "score": 0,
            "risk": "Unknown"
        }

    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)
        prompt = PromptTemplate.from_template("""
You are a fairness and compliance AI. Analyze the following job description for exclusionary language, gender bias, or ageist terminology.
Job Description:
{text}

Return your response strictly as a JSON object with the following schema:
{{
  "processed_text": "The original text but with HTML <span class='highlight-bias' title='Bias: [Type]'>biased_word</span> tags wrapping the biased words.",
  "suggestions": [
    {{"type": "Gender (or Age, etc.)", "word": "biased word", "replacement": "inclusive alternative"}}
  ],
  "gender_count": 0,
  "age_count": 0,
  "score": 0,
  "risk": "Low Risk" // Must be "Low Risk", "Medium Risk", or "High Risk" based on severity (0 to 100 score).
}}
Make sure it is valid JSON. Do not include markdown codeblocks like ```json.
""")
        response = llm.invoke(prompt.format(text=text))
        content = response.content.strip()
        
        # Clean up markdown if LLM includes it
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
            
        data = json.loads(content.strip())
        data["success"] = True
        return data
    except Exception as e:
        return {
            "success": True,
            "processed_text": text.replace('\n', '<br>'),
            "suggestions": [{"type": "Error", "word": "LLM Failed", "replacement": str(e)}],
            "gender_count": 0,
            "age_count": 0,
            "score": 0,
            "risk": "Low Risk"
        }

