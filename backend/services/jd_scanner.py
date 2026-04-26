import os
import json
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

BIAS_PATTERNS = [
    {"type": "Gender", "word": "aggressive", "replacement": "proactive"},
    {"type": "Gender", "word": "dominant", "replacement": "collaborative"},
    {"type": "Gender", "word": "rockstar", "replacement": "high-performing"},
    {"type": "Gender", "word": "ninja", "replacement": "specialist"},
    {"type": "Age", "word": "young", "replacement": "early-career"},
    {"type": "Age", "word": "digital native", "replacement": "comfortable with technology"},
    {"type": "Age", "word": "recent graduate", "replacement": "entry-level candidate"},
]

def _risk_from_score(score: int) -> str:
    if score >= 60:
        return "High Risk"
    if score >= 30:
        return "Medium Risk"
    return "Low Risk"

def _rule_based_scan(text: str):
    suggestions = []
    highlighted = text
    gender_count = 0
    age_count = 0

    for item in BIAS_PATTERNS:
        pattern = re.compile(r"\b" + re.escape(item["word"]) + r"\b", re.IGNORECASE)
        matches = list(pattern.finditer(highlighted))
        if not matches:
            continue

        if item["type"] == "Gender":
            gender_count += len(matches)
        if item["type"] == "Age":
            age_count += len(matches)

        suggestions.append({
            "type": item["type"],
            "word": item["word"],
            "replacement": item["replacement"]
        })

        highlighted = pattern.sub(
            lambda m: f"<span class='highlight-bias' title='Bias: {item['type']}'>{m.group(0)}</span>",
            highlighted
        )

    unique_suggestions = [dict(t) for t in {tuple(s.items()) for s in suggestions}]
    total_hits = gender_count + age_count
    score = min(100, total_hits * 12)

    return {
        "processed_text": highlighted.replace("\n", "<br>"),
        "suggestions": unique_suggestions,
        "gender_count": gender_count,
        "age_count": age_count,
        "score": score,
        "risk": _risk_from_score(score)
    }

def scan(text: str):
    baseline = _rule_based_scan(text)
    if not os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY") == "your_gemini_api_key_here":
        baseline["success"] = True
        baseline["engine"] = "rule-based"
        return baseline

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
        data["engine"] = "llm"
        return data
    except Exception as e:
        baseline["success"] = True
        baseline["engine"] = "rule-based"
        baseline["fallback_reason"] = str(e)
        return baseline

