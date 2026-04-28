import os
import json
import re
import logging
from langchain_core.prompts import PromptTemplate
from .llm_helper import get_llm_wrapper

BIAS_DICTIONARY = {
    "gender": {
        "words": ["salesman", "chairman", "mankind", "manpower", "guys", "waitress", "stewardess", "policeman", "fireman", "mailman"],
        "suggestion": "Use gender-neutral terms like 'salesperson', 'chairperson', 'humanity', 'workforce', 'team', 'server', 'flight attendant'."
    },
    "age": {
        "words": ["young", "energetic", "recent graduate", "digital native", "mature", "older"],
        "suggestion": "Focus on experience and skills rather than age-related terms."
    },
    "physical": {
        "words": ["able-bodied", "walk", "stand", "lift", "carry", "healthy", "dynamic"],
        "suggestion": "Ensure physical requirements are truly essential. Use terms like 'move', 'transport', 'access'."
    },
    "family": {
        "words": ["unmarried", "single", "married", "family", "children", "dependents"],
        "suggestion": "Avoid assumptions about family status. Focus on job availability and requirements."
    }
}

def rule_based_fallback(text, domain, error_msg="LLM API not available"):
    issues = []
    text_lower = text.lower()
    
    for bias_category, data in BIAS_DICTIONARY.items():
        for word in data["words"]:
            # Simple word boundary regex
            if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                issues.append({
                    "highlight_phrase": word,
                    "bias_type": f"{bias_category.capitalize()} Bias",
                    "severity": "Medium",
                    "explanation": f"The term '{word}' may introduce {bias_category} bias.",
                    "suggestions": [data["suggestion"]]
                })
    
    # Add a generic system note for LLM unavailability without exposing internal error details
    if not issues:
        issues.append({
            "highlight_phrase": "LLM Unavailable",
            "bias_type": "System",
            "severity": "Low",
            "explanation": "Automated LLM analysis is unavailable. Basic rule check found no obvious bias terms.",
            "suggestions": []
        })
    else:
        issues.append({
            "highlight_phrase": "LLM Unavailable",
            "bias_type": "System",
            "severity": "Low",
            "explanation": "Automated LLM analysis is unavailable. Showing results from basic rule-based engine.",
            "suggestions": []
        })
    # Quick scan of the prompt/context for biasing language (e.g., 'prefer', 'must', 'only')
    prompt_bias_analysis = []
    prompt_indicators = [
        (r"\bprefer(s|red)?\b", "Preference language can introduce selection bias; consider focusing on skills or objective criteria."),
        (r"\bmust\b", "Hard requirements can exclude otherwise qualified candidates; confirm necessity or rephrase as 'prefer' or 'able to' if essential."),
        (r"\bonly\b", "Exclusive language can be discriminatory; consider broadening criteria."),
        (r"\bnative\b", "Language requirements may be biased against non-native speakers; consider specifying necessary proficiency instead."),
        (r"\byoung\b", "Age-related language can introduce age bias; focus on experience instead."),
    ]
    for pattern, suggestion in prompt_indicators:
        if re.search(pattern, text_lower):
            prompt_bias_analysis.append({
                "phrase": pattern.strip('\\b'),
                "explanation": suggestion
            })

    # Compute simple significance/confidence metrics for frontend display
    # Severity weights: Low=1, Medium=2, High=3
    weight_map = {"Low": 1, "Medium": 2, "High": 3}
    total_weight = 0
    max_possible = len(issues) * 3 if issues else 1
    for it in issues:
        sev = it.get("severity", "Medium")
        total_weight += weight_map.get(sev, 2)
        # per-issue impact estimate
        it["impact_score"] = weight_map.get(sev, 2) * 10  # 10/30 scale per issue

    weighted_score = min(100, int((total_weight / max_possible) * 100))
    # Rule-based confidence is lower than LLM (conservative)
    confidence = 55 + min(40, len(issues) * 5)  # 55-95 depending on findings

    return {
        "success": True,
        "module_name": "Bias Language Analyzer",
        "domain": domain,
        "bias_score": weighted_score,
        "risk_level": "Medium Risk" if weighted_score >= 40 else ("High Risk" if weighted_score >= 70 else "Low Risk"),
        "issues": issues,
        "rewritten_text": text + "\n\n[Note: Rewriting requires an active LLM; original text is shown.]",
        "notes": ["Fell back to rule-based engine due to LLM unavailability."],
        "llm_available": False,
        "significance": weighted_score,
        "confidence": confidence
        ,
        "prompt_bias_analysis": prompt_bias_analysis
    }

def scan(text: str, domain: str = "Hiring", context_rules: dict = None):
    # Setup LLM
    wrapper = get_llm_wrapper(temperature=0.1)
    
    # Simple rule-based fallback if LLM is not available
    if not wrapper:
        return rule_based_fallback(text, domain, "No API key configured")

    # Resolve context_rules parsing to readable string
    context_str = "None provided"
    if context_rules:
        context_str = json.dumps(context_rules)

    prompt = PromptTemplate.from_template("""
You are a Bias Language Analyzer and AI fairness platform. Analyze the following text acting as a decision-influencing document in the '{domain}' domain.

Domain: {domain}
Context Rules: {context_rules}
Text:
{text}

Identify and classify any biased or exclusionary language based on the domain context. If a requirement is justified by the Context Rules, do NOT flag it, or mark it as 'Context-dependent' instead of 'biased'.

Return your response STRICTLY as a JSON object with exactly the following schema:
{{
  "module_name": "Bias Language Analyzer",
  "domain": "{domain}",
  "bias_score": <number 0-100>,
  "risk_level": "<Low|Medium|High>",
  "issues": [
    {{
      "highlight_phrase": "<exact biased word/phrase from text>",
      "bias_type": "<category like Gender, Age, Healthcare access, Loan requirements, etc.>",
      "severity": "<Low|Medium|High>",
      "explanation": "<why it's problematic in this context>",
      "suggestions": ["<alt1>", "<alt2>"]
    }}
  ],
  "rewritten_text": "<Full text rewritten to remove biased wording, preserving intent and requirements, and using inclusive, neutral language>",
  "notes": [
    "Context-dependent flags are marked where applicable",
    "All fixes aim to preserve intent while improving inclusivity"
  ]
}}

Make sure it is valid JSON without code blocks or markdown backticks around it. DO NOT include ```json ... ``` tags.
""")

    try:
        response = wrapper.invoke(prompt.format(text=text, domain=domain, context_rules=context_str))
        content = response.content.strip()
        
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
            
        data = json.loads(content.strip())
        data["success"] = True
        data["llm_available"] = True
        # Ensure significance/confidence are present; if not, compute conservative defaults
        try:
            # compute if missing or invalid
            if "significance" not in data or not isinstance(data.get("significance"), (int, float)):
                # derive from bias_score if available
                bs = float(data.get("bias_score", 0))
                data["significance"] = int(bs)
            if "confidence" not in data or not isinstance(data.get("confidence"), (int, float)):
                # assume high confidence for LLM results
                data["confidence"] = 85
        except Exception:
            data["significance"] = int(data.get("bias_score", 0)) if data.get("bias_score") else 0
            data["confidence"] = 75

        # Add per-issue impact_score if missing
        if data.get("issues"):
            for it in data["issues"]:
                if "impact_score" not in it:
                    sev = it.get("severity", "Medium")
                    it["impact_score"] = {"Low":10, "Medium":20, "High":30}.get(sev, 15)

        return data
        
    except Exception as e:
        # Log the original LLM exception server-side for diagnostics (not returned to frontend)
        logging.exception("LLM invocation failed while analyzing text for bias")
        # Graceful fallback to prevent frontend crash
        return rule_based_fallback(text, domain)
