# FairLens AI — API Documentation

Base URL: `http://localhost:8000`
Interactive Docs: `http://localhost:8000/docs`

---

## Endpoints

### GET /health
Returns system status.
```json
{ "status": "ok", "version": "3.0.0" }
```

---

### POST /api/analyze
Upload a CSV dataset and get a full bias audit.

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| file | File | CSV file |
| target_column | string | Outcome column (e.g. "hired") |
| sensitive_columns | string | JSON array: '["gender","race"]' |
| domain | string | hiring / loan / healthcare / education |

**Response:**
```json
{
  "bias_score": 72,
  "risk_level": "High",
  "selection_rates": [{"group":"Male","rate":0.74,"count":15,"positive":11}],
  "metrics": {
    "demographic_parity": 0.42,
    "disparate_impact": 0.57,
    "equal_opportunity": 0.34,
    "predictive_parity": 0.27
  },
  "feature_importance": [{"feature":"credit_score","importance":0.35,"is_sensitive":false}],
  "insights": ["..."],
  "row_count": 30,
  "columns": ["gender","race","gpa","hired"],
  "primary_sensitive": "gender"
}
```

---

### POST /api/mitigate
Apply Inverse Probability Reweighting mitigation.

**Request:** Same as `/api/analyze` plus:
| Field | Type | Description |
|-------|------|-------------|
| original_score | int | Bias score before mitigation |

**Response:** Same as `/api/analyze` plus:
```json
{
  "improvement": 58,
  "technique": "Inverse Probability Reweighting",
  "summary": "Bias score reduced from 72 → 14..."
}
```

---

### POST /api/analyze-text
Detect bias in text content.

**Request:** `application/json`
```json
{
  "text": "We need a young energetic salesman...",
  "domain": "hiring",
  "gemini_key": "AIza..."
}
```

**Response:**
```json
{
  "bias_score": 65,
  "risk_level": "Moderate",
  "flags": [
    {
      "phrase": "young",
      "type": "Age Bias",
      "suggestion": "motivated",
      "severity": "high",
      "start": 11,
      "end": 16
    }
  ],
  "rewritten_text": "We need a motivated professional...",
  "summary": "Found 3 bias patterns (2 high, 1 medium, 0 low).",
  "high_severity": 2,
  "medium_severity": 1,
  "low_severity": 0,
  "flag_count": 3
}
```

---

### POST /api/simulate
Predict individual outcome with counterfactual analysis.

**Request:** `application/json`
```json
{
  "profile": {
    "gender": "Female",
    "race": "Black",
    "age": 30,
    "experience": 5,
    "gpa": 3.5
  },
  "domain": "hiring"
}
```

**Response:**
```json
{
  "probability": 0.38,
  "outcome": false,
  "outcome_label": "Not Hired",
  "base_probability": 0.52,
  "bias_contribution": -0.14,
  "counterfactuals": [
    {
      "changed_field": "gender",
      "original_value": "Female",
      "changed_value": "Male",
      "probability": 0.52,
      "outcome": true,
      "delta": 0.14,
      "bias_contribution": 0.0
    }
  ],
  "bias_detected": true,
  "max_delta": 0.14
}
```

---

### POST /api/chat
AI assistant (Gemini + rule-based fallback).

**Request:** `application/json`
```json
{
  "message": "What is disparate impact?",
  "history": [],
  "gemini_key": "AIza..."
}
```

**Response:**
```json
{
  "reply": "**Disparate Impact** = minority_rate / majority_rate...",
  "source": "gemini"
}
```

---

## Error Responses
All errors return:
```json
{ "detail": "Error message here" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (invalid CSV, missing columns, empty file) |
| 422 | Validation error (missing required fields) |
| 500 | Internal server error |
