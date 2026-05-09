"""
FairLens AI — Dataset Analysis API
POST /api/analyze   → full bias audit from CSV upload
POST /api/mitigate  → reweighting mitigation
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import json
import io

from app.services.bias_service import (
    preprocess, train_model, compute_selection_rates,
    compute_fairness_metrics, compute_bias_score,
    compute_feature_importance, generate_insights, apply_reweighting,
)
from app.utils.helpers import compute_bias_score as calc_score

router = APIRouter()


def _run_analysis(df: pd.DataFrame, target_col: str, sens_cols: list, domain: str) -> dict:
    if target_col not in df.columns:
        raise HTTPException(400, f"Target '{target_col}' not in columns: {list(df.columns)}")
    valid = [c for c in sens_cols if c in df.columns]
    if not valid:
        raise HTTPException(400, f"None of {sens_cols} found in dataset columns")
    if len(df) < 4:
        raise HTTPException(400, "Dataset needs at least 4 rows")

    primary = valid[0]
    X, y = preprocess(df, target_col, valid)
    model = train_model(X, y)
    sel_rates = compute_selection_rates(df, target_col, primary)
    metrics   = compute_fairness_metrics(df, target_col, primary, model, X)
    bias_score = calc_score(
        metrics['demographic_parity'],
        metrics['disparate_impact'],
        metrics.get('equal_opportunity', 0),
    )
    feat_imp = compute_feature_importance(model, list(X.columns), valid)
    insights = generate_insights(sel_rates, metrics, bias_score, primary)

    return {
        "bias_score":        bias_score,
        "risk_level":        "High" if bias_score >= 70 else "Moderate" if bias_score >= 40 else "Low",
        "selection_rates":   sel_rates,
        "metrics":           metrics,
        "feature_importance": feat_imp,
        "insights":          insights,
        "row_count":         len(df),
        "columns":           list(df.columns),
        "primary_sensitive": primary,
    }


@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    sensitive_columns: str = Form(...),
    domain: str = Form("hiring"),
):
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(400, "Only CSV files supported")
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(400, "File is empty")
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"CSV parse error: {e}")
    try:
        sens = json.loads(sensitive_columns)
    except Exception:
        sens = [sensitive_columns]
    return _run_analysis(df, target_column, sens, domain)


@router.post("/mitigate")
async def mitigate(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    sensitive_columns: str = Form(...),
    domain: str = Form("hiring"),
    original_score: int = Form(0),
    technique: str = Form('reweight'),
):
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"CSV parse error: {e}")
    try:
        sens = json.loads(sensitive_columns)
    except Exception:
        sens = [sensitive_columns]
    valid = [c for c in sens if c in df.columns]
    if not valid:
        raise HTTPException(400, "No valid sensitive columns found")
    # choose mitigation technique
    tech = (technique or 'reweight').lower()
    if tech == 'reweight':
        df_m = apply_reweighting(df, target_column, valid[0])
    elif tech == 'downsample' or tech == 'down-sample' or tech == 'down_sample':
        from app.services.bias_service import apply_downsampling
        df_m = apply_downsampling(df, target_column, valid[0])
    else:
        # unknown technique: fallback to no-op
        df_m = df.copy()
    result = _run_analysis(df_m, target_column, sens, domain)
    result["improvement"] = original_score - result["bias_score"]
    result["technique"]   = "Inverse Probability Reweighting" if (tech == 'reweight') else ("Downsampling" if tech.startswith('down') else 'None')
    result["summary"]     = (
        f"Bias score reduced from {original_score} → {result['bias_score']} "
        f"({original_score - result['bias_score']:+d} points). "
        f"Disparate impact improved to {result['metrics']['disparate_impact']:.3f}."
    )
    return result
