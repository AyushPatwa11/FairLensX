import io
import json
import os
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from fairlearn.metrics import demographic_parity_difference, selection_rate
from fairlearn.reductions import ExponentiatedGradient, DemographicParity
import numpy as np

# Ensure models directory exists
os.makedirs("models", exist_ok=True)

LAST_ANALYSIS = {}

def analyze(file_content: bytes, target: str, sensitive_json: str):
    try:
        # 1. Load dataset
        df = pd.read_csv(io.BytesIO(file_content))
        # Accept flexible formats for `sensitive` field coming from the frontend.
        # Frontend normally sends a JSON string (e.g. '["Gender"]'), but some
        # clients may send slightly different formats. Try json.loads first,
        # then fall back to safe coercions.
        # Debug: log raw incoming value for `sensitive` to help diagnose parsing issues
        try:
            print("[dataset_analyzer] raw sensitive field:", repr(sensitive_json))
        except Exception:
            pass

        try:
            sensitive_cols = json.loads(sensitive_json)
        except Exception:
            try:
                import ast
                sensitive_cols = ast.literal_eval(sensitive_json)
                if not isinstance(sensitive_cols, list):
                    sensitive_cols = [sensitive_cols]
            except Exception:
                s = (sensitive_json or "").strip()
                s = s.strip('[]')
                if not s:
                    sensitive_cols = []
                else:
                        sensitive_cols = [x.strip().strip('"').strip("'") for x in s.split(',') if x.strip()]
        
        if target not in df.columns:
            return {"success": False, "error": f"Target column '{target}' not found in dataset."}
            
        # Drop rows with missing target values
        df = df.dropna(subset=[target])
            
        # 2. Data & column mapping (auto-detect usable features)
        preferred_features = ["Experience", "Education", "Gender", "Age"]
        expected_features = [f for f in preferred_features if f in df.columns and f != target]
        if not expected_features:
            expected_features = [c for c in df.columns if c != target]

        if not expected_features:
            return {"success": False, "error": "No usable feature columns found after mapping."}

        X = df[expected_features]
        y = df[target]

        # 3. Model training / evaluation pipeline
        categorical_features = [c for c in expected_features if X[c].dtype == "object"]
        numeric_features = [c for c in expected_features if c not in categorical_features]

        from sklearn.impute import SimpleImputer
        from sklearn.pipeline import Pipeline

        num_pipeline = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="mean")),
            ("scaler", StandardScaler())
        ])

        cat_pipeline = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("ohe", OneHotEncoder(handle_unknown="ignore"))
        ])

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", num_pipeline, numeric_features),
                ("cat", cat_pipeline, categorical_features)
            ],
            remainder="drop"
        )

        model = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", LogisticRegression(max_iter=1000))
        ])

        # 4. Train model
        model.fit(X, y)

        # 5. Bias analysis by sensitive attributes
        y_pred = model.predict(X)
        valid_sensitive = [c for c in sensitive_cols if c in df.columns]
        if not valid_sensitive and "Gender" in df.columns:
            valid_sensitive = ["Gender"]

        group_metrics = []
        dpd_values = []
        for sensitive_feature in valid_sensitive:
            try:
                groups = df[sensitive_feature]
                dpd = abs(demographic_parity_difference(y_true=y, y_pred=y_pred, sensitive_features=groups))
                dpd_values.append(dpd)
                rates = {}
                pos_label = model.named_steps["classifier"].classes_[-1]
                for group_value in groups.dropna().unique():
                    mask = groups == group_value
                    rates[str(group_value)] = round(float(selection_rate(y_true=y[mask], y_pred=y_pred[mask], pos_label=pos_label)), 3)
                group_metrics.append({
                    "attribute": sensitive_feature,
                    "demographic_parity_difference": round(float(dpd), 3),
                    "selection_rates": rates
                })
            except Exception:
                continue

        max_dpd = max(dpd_values) if dpd_values else 0.0
        bias_score = int(max_dpd * 100)
        risk_level = "Low Risk"
        if bias_score > 20:
            risk_level = "Medium Risk"
        if bias_score > 40:
            risk_level = "High Bias Detected"

        # 6. Generate Hybrid AI Report
        ai_report = ""
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                from .llm_helper import get_llm_wrapper
                wrapper = get_llm_wrapper(temperature=0.2)
                if wrapper:
                    from langchain_core.prompts import PromptTemplate
                    
                    stats_text = f"Total Candidates Analyzed: {len(df)}\nOutcome Variable (e.g. Hired): {target}\n"
                    for g in group_metrics:
                        stats_text += f"\nAttribute: {g['attribute']}\n- Demographic Parity Difference: {g['demographic_parity_difference']}\n- Selection Rates by Group: {g['selection_rates']}\n"
                    
                    prompt_text = """You are an expert AI Bias Auditor and HR Analytics Specialist.

You have been given the statistical summary of a recruitment dataset. 
Your task is to perform a thorough **bias detection analysis** on the hiring decisions based strictly on these metrics:

{stats}

Follow these steps carefully:

1. **Overall Selection Rate Analysis**
2. **Bias Detection Across Dimensions** (Analyze the provided selection rates and Demographic Parity Differences)
3. **Statistical Analysis** (Highlight significant disparities)
4. **Bias Classification** (Severity: Mild / Moderate / Severe / Critical, and provide evidence)
5. **Recommendations**

Rules:
- Be objective, data-driven, and neutral. Do not add moral judgments.
- Use clear, professional Markdown formatting.
- Always support your conclusions with the numbers and percentages provided above. Do not hallucinate data.
- Keep the report concise and high-impact.
"""
                    prompt = PromptTemplate.from_template(prompt_text)
                    response = wrapper.invoke(prompt.format(stats=stats_text))
                    ai_report = response.content
                else:
                    ai_report = "API Key found but LLM initialization failed."
            except Exception as e:
                ai_report = f"Failed to generate AI report: {str(e)}"
        else:
            ai_report = "Offline Mode: AI Audit Report unavailable. Please add an API key to enable."

        # 7. Extract Feature Importances (XAI)
        coefs = model.named_steps["classifier"].coef_[0]
        feature_names = preprocessor.get_feature_names_out()
        
        # Create dictionary of absolute values for sorting, but keep original values
        importance_dict = {name.replace('cat__', '').replace('num__', ''): float(coef) 
                           for name, coef in zip(feature_names, coefs)}
        
        # Sort by absolute magnitude and get top 5
        sorted_features = sorted(importance_dict.items(), key=lambda item: abs(item[1]), reverse=True)[:5]
        feature_importances = {k: round(v, 3) for k, v in sorted_features}

        # 8. Save model + state for mitigation/re-evaluation
        joblib.dump(model, "models/latest_model.pkl")
        global LAST_ANALYSIS
        LAST_ANALYSIS = {
            "score": bias_score,
            "group_metrics": group_metrics,
            "X": X,
            "y": y,
            "preprocessor": preprocessor,
            "valid_sensitive": valid_sensitive
        }

        return {
            "success": True,
            "rows": len(df),
            "cols": len(df.columns),
            "score": bias_score,
            "risk": risk_level,
            "group_metrics": group_metrics,
            "ai_report": ai_report,
            "feature_importances": feature_importances,
            "message": f"Model successfully trained on {len(df)} rows. Weights saved to disk."
        }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        return {"success": False, "error": f"{str(e)} | Trace: {error_trace}"}

def mitigate():
    try:
        if not LAST_ANALYSIS or "X" not in LAST_ANALYSIS:
            return {"success": False, "error": "No dataset available for mitigation. Please run Mode 1 analysis first."}
            
        X = LAST_ANALYSIS["X"]
        y = LAST_ANALYSIS["y"]
        preprocessor = LAST_ANALYSIS["preprocessor"]
        valid_sensitive = LAST_ANALYSIS["valid_sensitive"]
        previous_score = LAST_ANALYSIS.get("score", 60)
        
        if not valid_sensitive:
            return {"success": False, "error": "No sensitive attributes found to mitigate."}
            
        # We will mitigate based on the first identified sensitive feature
        sensitive_feature = valid_sensitive[0]
        groups = X[sensitive_feature]
        
        # Transform data using the already fitted preprocessor
        X_transformed = preprocessor.transform(X)
        
        # Apply True Algorithmic Mitigation using ExponentiatedGradient
        base_estimator = LogisticRegression(max_iter=1000)
        mitigator = ExponentiatedGradient(
            estimator=base_estimator,
            constraints=DemographicParity(),
            max_iter=20
        )
        
        mitigator.fit(X_transformed, y, sensitive_features=groups)
        
        # Predict with mitigated model
        y_pred_mitigated = mitigator.predict(X_transformed)
        
        # Calculate new bias score
        dpd = abs(demographic_parity_difference(y_true=y, y_pred=y_pred_mitigated, sensitive_features=groups))
        new_score = int(dpd * 100)
        reduction = previous_score - new_score
        
        # Wrap the mitigated estimator back into a pipeline so Mode 3 can use it seamlessly
        mitigated_pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", mitigator)
        ])
        
        joblib.dump(mitigated_pipeline, "models/latest_model.pkl")
        
        return {
            "success": True,
            "new_score": new_score,
            "message": f"Algorithmic Mitigation (Exponentiated Gradient) Applied Successfully on {sensitive_feature}. Debiased model saved.",
            "reduction": reduction
        }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        return {"success": False, "error": f"Mitigation failed: {str(e)} | Trace: {error_trace}"}
