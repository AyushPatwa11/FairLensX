"""FairLens AI — AI Assistant API — POST /api/chat"""
from fastapi import APIRouter
from app.models.schemas import ChatRequest
import json, os, urllib.request

router = APIRouter()

SYSTEM_CTX = """You are FairLens AI Assistant, an expert in algorithmic fairness, bias detection, and AI governance.
Help users understand bias metrics, interpret audit results, choose mitigation strategies, and navigate legal frameworks (EEOC, EU AI Act, GDPR).
Be concise, clear, and use examples. Format important terms in **bold**."""

RULE_BASED = {
    'bias score':       "The **Bias Score** (0-100): Low (<40) = acceptable, Moderate (40-70) = needs review, High (>70) = immediate action. Weighted from demographic parity (30%), disparate impact (35%), equal opportunity (25%).",
    'disparate impact': "**Disparate Impact** = minority_rate / majority_rate. The **4/5ths rule** requires ≥ 0.80. Below 0.80 may constitute illegal discrimination under EEOC guidelines.",
    'demographic parity': "**Demographic Parity** = difference in positive outcome rates across groups. Ideal: < 0.10. Values > 0.10 indicate significant disparity that needs investigation.",
    'equal opportunity': "**Equal Opportunity** measures the True Positive Rate (TPR) gap across groups. High TPR gap means qualified individuals from disadvantaged groups are less likely to receive positive outcomes.",
    'mitigation':       "FairLens uses **Inverse Probability Reweighting** — upweights underrepresented outcome groups to equalize selection rates. Other techniques: resampling, threshold adjustment, adversarial debiasing.",
    'mode 1':           "**Mode 1 — Dataset Analyzer**: Upload CSV → select target & sensitive columns → system trains Random Forest → computes fairness metrics → one-click mitigation with before/after comparison.",
    'mode 2':           "**Mode 2 — Language Scanner**: Paste any text → system detects 27+ bias patterns (age, gender, origin, family, disability) → highlights phrases → suggests alternatives → generates inclusive rewrite.",
    'mode 3':           "**Mode 3 — Bias Simulator**: Enter individual profile → predict outcome (hired/loan/admitted) → counterfactual analysis shows how changing gender/race/insurance shifts the decision.",
    'upload':           "To upload: Go to **Mode 1** → click upload zone or drag-drop your CSV → select target column (hired/approved) → select sensitive attributes → click **Run Bias Audit**.",
    'hello':            "Hello! I'm the **FairLens AI Assistant**. Ask me about:\n- Bias metrics (disparate impact, demographic parity)\n- How to use each mode\n- Mitigation strategies\n- Legal compliance (EEOC, EU AI Act, GDPR)",
    '4/5':              "The **4/5ths Rule** (EEOC): If the selection rate for a protected group is less than 80% of the highest group's rate, this indicates adverse impact. FairLens flags this automatically.",
}

@router.post("/chat")
async def chat(req: ChatRequest):
    api_key = req.gemini_key or os.getenv("GEMINI_API_KEY", "")
    if api_key:
        try:
            history = "\n".join([f"{m.role.upper()}: {m.content}" for m in (req.history or [])[-6:]])
            prompt  = f"{SYSTEM_CTX}\n\nConversation:\n{history}\nUSER: {req.message}\nASSISTANT:"
            payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
            url     = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            r       = urllib.request.urlopen(urllib.request.Request(url, payload, {"Content-Type": "application/json"}), timeout=15)
            data    = json.loads(r.read())
            reply   = data['candidates'][0]['content']['parts'][0]['text'].strip()
            return {"reply": reply, "source": "gemini"}
        except Exception:
            pass
    msg = req.message.lower()
    for key, reply in RULE_BASED.items():
        if key in msg:
            return {"reply": reply, "source": "rule-based"}
    return {"reply": f"I can help with bias detection, fairness metrics, and FairLens usage. Try: 'What is disparate impact?' or 'How do I use Mode 1?' or 'What is mitigation?'", "source": "rule-based"}
