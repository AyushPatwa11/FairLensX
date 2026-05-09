"""
FairLens AI — Shared Utility Helpers
"""
import pandas as pd
import numpy as np
from typing import Any


def safe_numeric(value: Any, lo: float, hi: float) -> float:
    """Normalize a numeric value to [0, 1] using known range."""
    try:
        v = float(value)
        return max(0.0, min(1.0, (v - lo) / (hi - lo))) if hi > lo else 0.5
    except (ValueError, TypeError):
        return 0.5


def encode_ordinal(value: str) -> float:
    """Map categorical string to numeric [0,1] for merit computation."""
    ORDINAL_MAP = {
        # Gender — all neutral (sensitive, not merit)
        'male': 0.5, 'female': 0.5, 'non-binary': 0.5,
        # Race — all neutral (sensitive)
        'white': 0.5, 'asian': 0.5, 'hispanic': 0.5, 'black': 0.5, 'other': 0.5,
        # Insurance
        'private': 0.9, 'public': 0.4, 'none': 0.1,
        # Income bracket
        'high': 0.9, 'medium': 0.55, 'low': 0.2,
        # Education
        'phd': 1.0, 'masters': 0.85, 'bachelors': 0.70, 'high school': 0.45,
        # Boolean
        'yes': 1.0, 'no': 0.0, 'true': 1.0, 'false': 0.0,
        'approved': 1.0, 'denied': 0.0, 'hired': 1.0, 'rejected': 0.0,
    }
    return ORDINAL_MAP.get(str(value).strip().lower(), 0.5)


def get_positive_count(series: pd.Series) -> int:
    """Count positive outcomes robustly for binary or multi-class targets."""
    s = series.copy()
    if s.dtype == object or s.dtype.name == 'category':
        s_str = s.fillna('').astype(str).str.strip().str.lower()
        pos = s_str.isin(['1', 'yes', 'true', 'approved', 'hired', 'selected',
                          'admitted', 'referred', 'treated', 'positive', 'accept'])
        if pos.sum() == 0 and len(s_str) > 0:
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            enc = le.fit_transform(s_str)
            pos = enc == enc.max()
    else:
        s_num = pd.to_numeric(s, errors='coerce').fillna(0)
        if s_num.nunique() > 2:
            pos = s_num > s_num.median()
        else:
            pos = s_num == s_num.max()
    return int(pos.sum())


def compute_bias_score(dp: float, di: float, eo: float) -> int:
    """
    Weighted composite bias score 0–100.
    dp = demographic parity gap
    di = disparate impact ratio
    eo = equal opportunity gap
    """
    dp_score = min(100, abs(dp) * 200)
    di_score = min(100, max(0, (1.0 - di) * 125))
    eo_score = min(100, abs(eo) * 200)
    raw = dp_score * 0.30 + di_score * 0.35 + eo_score * 0.25
    return min(100, max(0, int(raw)))
