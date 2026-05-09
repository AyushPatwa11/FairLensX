"""FairLens AI — Text Analysis API — POST /api/analyze-text"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import TextAnalyzeRequest
from app.services.nlp_service import analyze_text_local, analyze_text_gemini
import os

router = APIRouter()

@router.post("/analyze-text")
async def analyze_text(req: TextAnalyzeRequest):
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    api_key = req.gemini_key or os.getenv("GEMINI_API_KEY", "")
    if api_key:
        result = await analyze_text_gemini(req.text, req.domain, api_key)
        if result:
            return result
    return analyze_text_local(req.text)
