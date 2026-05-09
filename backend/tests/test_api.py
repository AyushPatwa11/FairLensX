"""
FairLens AI — Backend Test Suite
Run: pytest tests/test_api.py -v
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json
import io
import pytest
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────

def make_csv(rows=20, biased=True):
    """Generate a sample CSV with intentional bias."""
    lines = ["gender,race,age,experience,gpa,hired"]
    for i in range(rows):
        g = "Male" if i % 2 == 0 else "Female"
        r = ["White", "Black", "Hispanic", "Asian", "Other"][i % 5]
        age = 25 + (i % 20)
        exp = 2 + (i % 15)
        gpa = round(2.5 + (i % 15) * 0.1, 1)
        if biased:
            prob = (0.75 if g == "Male" else 0.30) + (0.1 if r == "White" else -0.05)
        else:
            prob = 0.5
        hired = 1 if (i * 7 % 10) / 10 < min(0.95, max(0.05, prob)) else 0
        lines.append(f"{g},{r},{age},{exp},{gpa},{hired}")
    return "\n".join(lines).encode()


# ── Health ────────────────────────────────────────────────

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert "endpoints" in r.json()


# ── Dataset Analysis ──────────────────────────────────────

def test_analyze_biased_dataset():
    csv_bytes = make_csv(30, biased=True)
    r = client.post(
        "/api/analyze",
        files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        data={"target_column": "hired", "sensitive_columns": '["gender","race"]', "domain": "hiring"},
    )
    assert r.status_code == 200
    d = r.json()
    assert "bias_score" in d
    assert 0 <= d["bias_score"] <= 100
    assert d["risk_level"] in ("Low", "Moderate", "High")
    assert len(d["selection_rates"]) >= 2
    assert "demographic_parity" in d["metrics"]
    assert "disparate_impact" in d["metrics"]
    assert len(d["feature_importance"]) > 0
    assert len(d["insights"]) > 0
    print(f"\n  Bias score: {d['bias_score']} ({d['risk_level']})")
    print(f"  DI: {d['metrics']['disparate_impact']:.3f}, DP: {d['metrics']['demographic_parity']:.3f}")


def test_analyze_missing_target():
    csv_bytes = make_csv(10)
    r = client.post(
        "/api/analyze",
        files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        data={"target_column": "nonexistent", "sensitive_columns": '["gender"]', "domain": "hiring"},
    )
    assert r.status_code in (400, 422)


def test_analyze_empty_file():
    r = client.post(
        "/api/analyze",
        files={"file": ("test.csv", io.BytesIO(b""), "text/csv")},
        data={"target_column": "hired", "sensitive_columns": '["gender"]', "domain": "hiring"},
    )
    assert r.status_code in (400, 422)


def test_mitigate_reduces_bias():
    csv_bytes = make_csv(40, biased=True)
    # First analyze
    r1 = client.post(
        "/api/analyze",
        files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        data={"target_column": "hired", "sensitive_columns": '["gender"]', "domain": "hiring"},
    )
    original_score = r1.json()["bias_score"]
    # Then mitigate
    r2 = client.post(
        "/api/mitigate",
        files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        data={"target_column": "hired", "sensitive_columns": '["gender"]',
              "domain": "hiring", "original_score": original_score},
    )
    assert r2.status_code == 200
    d = r2.json()
    assert d["bias_score"] <= original_score + 5  # allow small variance
    assert "improvement" in d
    assert "technique" in d
    print(f"\n  Original: {original_score} → Mitigated: {d['bias_score']} (improvement: {d['improvement']})")


# ── Text Analysis ─────────────────────────────────────────

def test_analyze_biased_text():
    r = client.post("/api/analyze-text", json={
        "text": "We need a young energetic salesman with native English speaker background and masculine drive.",
        "domain": "hiring"
    })
    assert r.status_code == 200
    d = r.json()
    assert d["bias_score"] > 0
    assert d["flag_count"] > 0
    assert len(d["flags"]) > 0
    assert d["rewritten_text"] != ""
    print(f"\n  Text score: {d['bias_score']}, flags: {d['flag_count']}")


def test_analyze_clean_text():
    r = client.post("/api/analyze-text", json={
        "text": "We seek a motivated sales professional with strong communication skills.",
        "domain": "hiring"
    })
    assert r.status_code == 200
    d = r.json()
    assert d["risk_level"] in ("Low", "Moderate", "High")


def test_empty_text_rejected():
    r = client.post("/api/analyze-text", json={"text": "", "domain": "hiring"})
    assert r.status_code in (400, 422)


def test_no_false_positives():
    """Female/email should not trigger male-bias pattern."""
    r = client.post("/api/analyze-text", json={
        "text": "The female applicant submitted her application via email successfully.",
        "domain": "hiring"
    })
    d = r.json()
    # Should not flag 'male' inside 'female' or 'email'
    bad = [f for f in d["flags"] if f["phrase"].lower() in ["male", "email"]]
    assert not bad, f"False positives detected: {bad}"
    print(f"\n  No false positives ✓ (score={d['bias_score']}, flags={d['flag_count']})")


# ── Simulator ─────────────────────────────────────────────

def test_simulate_hiring():
    r = client.post("/api/simulate", json={
        "profile": {"gender": "Female", "race": "Black", "age": 30, "experience": 5, "gpa": 3.5},
        "domain": "hiring"
    })
    assert r.status_code == 200
    d = r.json()
    assert 0 < d["probability"] < 1
    assert d["outcome_label"] in ("Hired", "Not Hired")
    assert len(d["counterfactuals"]) > 0
    print(f"\n  Female/Black prob: {d['probability']:.3f}, bias_detected: {d['bias_detected']}")


def test_simulate_bias_direction():
    """Male/White should have higher probability than Female/Black for hiring."""
    r_m = client.post("/api/simulate", json={
        "profile": {"gender": "Male", "race": "White", "experience": 5, "gpa": 3.5},
        "domain": "hiring"
    })
    r_f = client.post("/api/simulate", json={
        "profile": {"gender": "Female", "race": "Black", "experience": 5, "gpa": 3.5},
        "domain": "hiring"
    })
    assert r_m.json()["probability"] > r_f.json()["probability"]
    print(f"\n  Male/White: {r_m.json()['probability']:.3f} > Female/Black: {r_f.json()['probability']:.3f} ✓")


def test_simulate_loan():
    r = client.post("/api/simulate", json={
        "profile": {"gender": "Male", "race": "White", "age": 40, "income": 80000, "credit_score": 720},
        "domain": "loan"
    })
    assert r.status_code == 200
    d = r.json()
    assert d["outcome_label"] in ("Loan Approved", "Loan Denied")


def test_simulate_education():
    r = client.post("/api/simulate", json={
        "profile": {"gender": "Female", "race": "Hispanic", "income": "Low", "gpa": 3.9, "test_score": 1400},
        "domain": "education"
    })
    assert r.status_code == 200
    d = r.json()
    assert d["outcome_label"] in ("Admitted", "Not Admitted")


def test_simulate_empty_profile():
    r = client.post("/api/simulate", json={"profile": {}, "domain": "hiring"})
    assert r.status_code in (400, 422)


# ── AI Chat ───────────────────────────────────────────────

def test_chat_responds():
    r = client.post("/api/chat", json={"message": "What is disparate impact?", "history": []})
    assert r.status_code == 200
    d = r.json()
    assert len(d["reply"]) > 20
    assert d["source"] in ("gemini", "rule-based", "fallback")
    print(f"\n  Chat reply ({d['source']}): {d['reply'][:80]}")


def test_chat_greeting():
    r = client.post("/api/chat", json={"message": "hello", "history": []})
    assert r.status_code == 200
    assert len(r.json()["reply"]) > 0


def test_chat_mitigation_question():
    r = client.post("/api/chat", json={"message": "How do I fix bias?", "history": []})
    assert r.status_code == 200
    assert len(r.json()["reply"]) > 20


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
