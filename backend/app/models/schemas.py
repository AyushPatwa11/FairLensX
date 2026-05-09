"""
FairLens AI — Pydantic Request/Response Schemas
All data models for API endpoints
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


# ── Dataset Analysis ──────────────────────────────────────
class SelectionRate(BaseModel):
    group: str
    rate: float
    count: int
    positive: int


class FairnessMetrics(BaseModel):
    demographic_parity: float = Field(description="Difference in positive rates (ideal < 0.10)")
    disparate_impact: float   = Field(description="Ratio of rates — must be ≥ 0.80 (4/5ths rule)")
    equal_opportunity: float  = Field(description="True positive rate gap (ideal < 0.10)")
    predictive_parity: float  = Field(description="Precision gap across groups (ideal < 0.10)")


class FeatureImportance(BaseModel):
    feature: str
    importance: float
    is_sensitive: bool


class AnalysisResponse(BaseModel):
    bias_score: int             = Field(ge=0, le=100, description="0=fair, 100=maximally biased")
    risk_level: str             = Field(description="Low | Moderate | High")
    selection_rates: List[SelectionRate]
    metrics: FairnessMetrics
    feature_importance: List[FeatureImportance]
    insights: List[str]
    row_count: int
    columns: List[str]
    primary_sensitive: str


class MitigationResponse(AnalysisResponse):
    improvement: int
    technique: str
    summary: str


# ── Text Analysis ─────────────────────────────────────────
class TextAnalyzeRequest(BaseModel):
    text: str                           = Field(min_length=1, max_length=10000)
    domain: str                         = Field(default="hiring")
    gemini_key: Optional[str]           = None


class BiasFlag(BaseModel):
    phrase: str
    type: str
    suggestion: str
    severity: str                       = Field(description="low | medium | high")
    start: int
    end: int


class TextAnalyzeResponse(BaseModel):
    bias_score: int
    risk_level: str
    flags: List[BiasFlag]
    rewritten_text: str
    summary: str
    high_severity: int
    medium_severity: int
    low_severity: int
    flag_count: int


# ── Simulator ─────────────────────────────────────────────
class SimulateRequest(BaseModel):
    profile: Dict[str, Any]
    domain: str = "hiring"


class Counterfactual(BaseModel):
    changed_field: str
    original_value: str
    changed_value: str
    probability: float
    outcome: bool
    delta: float
    bias_contribution: float


class SimulateResponse(BaseModel):
    probability: float
    outcome: bool
    outcome_label: str
    base_probability: float
    bias_contribution: float
    counterfactuals: List[Counterfactual]
    bias_detected: bool
    max_delta: float


# ── AI Chat ───────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str                        = Field(min_length=1, max_length=2000)
    history: Optional[List[ChatMessage]] = []
    gemini_key: Optional[str]           = None


class ChatResponse(BaseModel):
    reply: str
    source: str                         = Field(description="gemini | rule-based | fallback")
