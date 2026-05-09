"""
FairLens AI — NLP Bias Detection Service
Rule-based pattern matching + optional Gemini AI enhancement
"""
import re
import json
import os
from typing import List, Dict, Any, Optional

BIAS_PATTERNS = [
    (r'\byoung(?:er)?\b', 'Age Bias', 'motivated', 'high'),
    (r'\brecent\s+graduate\b', 'Age Bias', 'qualified candidate', 'medium'),
    (r'\benergetic\b|\bgo[- ]getter\b', 'Age Bias', 'results-driven', 'medium'),
    (r'\byouthful\b', 'Age Bias', 'enthusiastic', 'high'),
    (r'\belderly\b', 'Age Bias', 'older adults', 'high'),
    (r'\bdigital\s+native\b', 'Age Bias', 'tech-savvy professional', 'medium'),
    (r'\boverqualified\b', 'Age Bias', 'highly experienced', 'medium'),
    (r'\bmasculine\b|\bmanly\b', 'Gender Bias', 'determined', 'high'),
    (r'\bsalesman\b', 'Gender Bias', 'sales professional', 'high'),
    (r'\baggressive\b', 'Gender Bias', 'assertive and driven', 'medium'),
    (r'\bmanpower\b', 'Gender Bias', 'workforce', 'medium'),
    (r'\bchairman\b', 'Gender Bias', 'chairperson', 'medium'),
    (r'\bstewardess\b|\bwaitress\b', 'Gender Bias', 'flight attendant / server', 'medium'),
    (r'\bnative\s+english\s+speaker\b', 'National Origin Bias', 'fluent English skills', 'high'),
    (r'\bnative[- ]born\b', 'National Origin Bias', 'legally authorized to work', 'high'),
    (r'\bculturally?\s+(?:aligned|fit|match)\b', 'Cultural Bias', 'values-aligned', 'high'),
    (r'\bculture\s+fit\b', 'Cultural Bias', 'values alignment', 'high'),
    (r'\bfast[- ]paced\b', 'Coded Language', 'dynamic and collaborative', 'low'),
    (r'\brock\s*star\b|\bninja\b|\bguru\b', 'Exclusionary Jargon', 'highly skilled professional', 'low'),
    (r'\bheads?\s+of\s+household\b', 'Marital Status Bias', 'primary applicant', 'high'),
    (r'\bsingle\s+applicants?\b', 'Marital Status Bias', 'all applicants', 'high'),
    (r'\btraditional\s+famil(?:y|ies)\b', 'Family Status Bias', 'diverse backgrounds', 'high'),
    (r'\blegacy\s+applicants?\b', 'Legacy Preference Bias', 'returning applicants', 'high'),
    (r'\bprivate\s+insurance\b', 'Socioeconomic Bias', 'all insurance types', 'medium'),
    (r'\ble[- ]bodied\b', 'Disability Bias', 'capable of required tasks', 'high'),
    (r'\bprestigious\s+(?:university|school|institution)\b', 'Socioeconomic Bias', 'accredited institution', 'medium'),
    (r'\bhustle\s+culture\b', 'Coded Language', 'high-performance environment', 'medium'),
]


def analyze_text_local(text: str) -> Dict[str, Any]:
    flags, seen = [], set()
    for pattern_str, bias_type, suggestion, severity in BIAS_PATTERNS:
        try:
            for match in re.finditer(pattern_str, text, re.IGNORECASE):
                phrase = match.group()
                key = (phrase.lower(), bias_type)
                if key not in seen:
                    seen.add(key)
                    flags.append({
                        "phrase": phrase, "type": bias_type,
                        "suggestion": suggestion, "severity": severity,
                        "start": match.start(), "end": match.end()
                    })
        except re.error:
            continue

    flags.sort(key=lambda x: x["start"])
    h  = sum(1 for f in flags if f['severity'] == 'high')
    m  = sum(1 for f in flags if f['severity'] == 'medium')
    lo = sum(1 for f in flags if f['severity'] == 'low')
    score = min(100, h * 20 + m * 9 + lo * 3)

    rewritten = text
    for f in sorted(flags, key=lambda x: x["start"], reverse=True):
        s = f["suggestion"]
        if f["phrase"][0].isupper():
            s = s[0].upper() + s[1:]
        rewritten = rewritten[:f["start"]] + s + rewritten[f["end"]:]

    return {
        "bias_score": score,
        "risk_level": "High" if score >= 70 else "Moderate" if score >= 35 else "Low",
        "flags": flags, "rewritten_text": rewritten,
        "summary": f"Found {len(flags)} bias patterns ({h} high, {m} medium, {lo} low severity).",
        "high_severity": h, "medium_severity": m, "low_severity": lo, "flag_count": len(flags)
    }


async def analyze_text_gemini(text: str, domain: str, api_key: str) -> Optional[Dict]:
    try:
        import urllib.request
        prompt = f"""Analyze this {domain} text for linguistic bias. Return ONLY valid JSON (no markdown):
{{
  "bias_score": <0-100>,
  "risk_level": "<Low|Moderate|High>",
  "flags": [{{"phrase":"<exact phrase>","type":"<bias type>","suggestion":"<inclusive alternative>","severity":"<low|medium|high>","start":<int>,"end":<int>}}],
  "rewritten_text": "<full text with bias replaced>",
  "summary": "<one sentence summary>",
  "high_severity": <int>, "medium_severity": <int>, "low_severity": <int>, "flag_count": <int>
}}
Text: {text[:3000]}"""
        payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        req = urllib.request.Request(url, payload, {"Content-Type": "application/json"})
        r = urllib.request.urlopen(req, timeout=15)
        data = json.loads(r.read())
        raw = data['candidates'][0]['content']['parts'][0]['text'].strip()
        raw = raw.replace('```json', '').replace('```', '').strip()
        result = json.loads(raw)
        if "rewritten_text" not in result:
            result["rewritten_text"] = text
        return result
    except Exception:
        return None
