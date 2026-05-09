"""
FairLens AI — Bias Simulator Service
Individual-level prediction with counterfactual analysis
"""
import numpy as np
from typing import Dict, Any, List
from app.utils.helpers import safe_numeric, encode_ordinal

# Domain-specific feature ranges for merit normalization
FEATURE_RANGES = {
    'hiring':     {'age':(18,65),'experience':(0,40),'gpa':(0,4.0),'test_score':(400,1600)},
    'loan':       {'age':(18,80),'income':(10000,500000),'credit_score':(300,850),'loan_amount':(1000,500000)},
    'healthcare': {'age':(1,110),'bmi':(10,60),'severity':(1,10)},
    'education':  {'gpa':(0,4.0),'test_score':(400,1600),'age':(14,25)},
}

# Protected attribute bias weights (from empirical fairness literature)
BIAS_WEIGHTS = {
    'hiring': {
        'gender':    {'Male':+0.14,'Female':-0.08,'Non-binary':-0.05},
        'race':      {'White':+0.11,'Black':-0.10,'Hispanic':-0.07,'Asian':+0.02,'Other':-0.04},
        'age':       {'_peak':(28,42),'_range':(18,65),'_penalty':0.08},
    },
    'loan': {
        'gender':    {'Male':+0.12,'Female':-0.07,'Non-binary':-0.04},
        'race':      {'White':+0.09,'Black':-0.09,'Hispanic':-0.06,'Asian':+0.03,'Other':-0.03},
        'age':       {'_peak':(35,55),'_range':(18,80),'_penalty':0.06},
    },
    'healthcare': {
        'gender':    {'Male':+0.08,'Female':-0.05},
        'insurance': {'Private':+0.16,'Public':-0.09,'None':-0.15},
        'age':       {'_peak':(25,55),'_range':(1,110),'_penalty':0.07},
    },
    'education': {
        'gender':    {'Male':+0.07,'Female':-0.04,'Non-binary':-0.05},
        'race':      {'White':+0.10,'Asian':+0.05,'Black':-0.10,'Hispanic':-0.08,'Other':-0.05},
        'income':    {'High':+0.12,'Medium':0.0,'Low':-0.10},
    },
}

OUTCOME_LABELS = {
    'hiring':     ('Hired', 'Not Hired'),
    'loan':       ('Loan Approved', 'Loan Denied'),
    'healthcare': ('Referred', 'Not Referred'),
    'education':  ('Admitted', 'Not Admitted'),
}

SENSITIVE_KEYS = {'gender','race','ethnicity','age','insurance','income','nationality','zipcode'}

COUNTERFACTUAL_OPTIONS = {
    'gender':    ['Male','Female','Non-binary'],
    'race':      ['White','Black','Hispanic','Asian','Other'],
    'insurance': ['Private','Public','None'],
    'income':    ['Low','Medium','High'],
}


def _compute_merit(profile: Dict[str, Any], domain: str) -> float:
    """Compute merit-based probability from non-sensitive features only."""
    ranges = FEATURE_RANGES.get(domain, {})
    scores = []
    for k, v in profile.items():
        if k.lower() in SENSITIVE_KEYS:
            continue
        lo_hi = ranges.get(k.lower())
        if lo_hi:
            scores.append(safe_numeric(v, lo_hi[0], lo_hi[1]))
        else:
            try:
                fv = float(v)
                scores.append(min(1.0, fv / 100.0 if fv <= 100 else min(1.0, np.log10(fv + 1) / 6.0)))
            except (ValueError, TypeError):
                scores.append(encode_ordinal(str(v)))

    if not scores:
        return 0.50
    return max(0.15, min(0.85, float(np.mean(scores)) * 0.7 + 0.15))


def _compute_bias_delta(profile: Dict[str, Any], domain: str) -> float:
    """Compute total bias contribution from sensitive attributes."""
    cfg = BIAS_WEIGHTS.get(domain, {})
    delta = 0.0
    for field, biases in cfg.items():
        val = str(profile.get(field, '')).strip()
        if not val:
            continue
        if '_peak' in biases:
            try:
                age = float(val)
                lo, hi = biases['_peak']
                r_lo, r_hi = biases['_range']
                penalty = biases['_penalty']
                if age < lo:
                    delta -= penalty * (lo - age) / max(lo - r_lo, 1)
                elif age > hi:
                    delta -= penalty * (age - hi) / max(r_hi - hi, 1)
            except (ValueError, TypeError):
                pass
        else:
            for k, v in biases.items():
                if k.lower() == val.lower():
                    delta += v
                    break
    return delta


def predict(profile: Dict[str, Any], domain: str) -> Dict[str, Any]:
    """Predict outcome with real bias simulation."""
    base  = _compute_merit(profile, domain)
    delta = _compute_bias_delta(profile, domain)
    prob  = float(np.clip(base + delta, 0.03, 0.97))
    pos_lbl, neg_lbl = OUTCOME_LABELS.get(domain, ('Approved', 'Denied'))
    return {
        "probability":       round(prob, 4),
        "outcome":           prob >= 0.50,
        "outcome_label":     pos_lbl if prob >= 0.50 else neg_lbl,
        "base_probability":  round(base, 4),
        "bias_contribution": round(delta, 4),
    }


def counterfactual(profile: Dict[str, Any], domain: str, original_prob: float) -> List[Dict]:
    """Generate counterfactual comparisons for all protected attributes."""
    cfg = BIAS_WEIGHTS.get(domain, {})
    results = []
    for field in cfg.keys():
        if field.startswith('_') or field not in profile:
            continue
        cur = str(profile.get(field, ''))
        opts = COUNTERFACTUAL_OPTIONS.get(field, [])
        for alt in opts:
            if alt.lower() == cur.lower():
                continue
            mod = {**profile, field: alt}
            pred = predict(mod, domain)
            delta = pred['probability'] - original_prob
            if abs(delta) > 0.005:
                results.append({
                    "changed_field":    field,
                    "original_value":   cur,
                    "changed_value":    alt,
                    "probability":      pred['probability'],
                    "outcome":          pred['outcome'],
                    "delta":            round(delta, 4),
                    "bias_contribution": pred['bias_contribution'],
                })
    results.sort(key=lambda x: abs(x["delta"]), reverse=True)
    return results[:8]
