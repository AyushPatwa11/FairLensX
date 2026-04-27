import os
import joblib
import pandas as pd

def simulate(experience: int, education: str, orig_gender: str, cf_gender: str, scenario: str = "Hiring", age_group: str = "30-50"):
    model_path = "models/latest_model.pkl"
    
    if not os.path.exists(model_path):
        return {
            "success": False,
            "error": "No trained model found. Please run the Dataset Analyzer (Mode 1) first to train the model."
        }
        
    try:
        model = joblib.load(model_path)
        
        # Keep all non-sensitive inputs unchanged, then flip only the selected sensitive attribute.
        orig_data = pd.DataFrame([{
            'Experience': experience,
            'Education': education,
            'Gender': orig_gender,
            'Age': age_group
        }])
        
        cf_data = pd.DataFrame([{
            'Experience': experience,
            'Education': education,
            'Gender': cf_gender,
            'Age': age_group
        }])
        
        # Predict probability of positive class (Hired = 1)
        # Predict probability of positive class
        pos_class = model.named_steps["classifier"].classes_[-1]
        class_index = list(model.named_steps["classifier"].classes_).index(pos_class)
        
        orig_prob = model.predict_proba(orig_data)[0][class_index] * 100
        cf_prob = model.predict_proba(cf_data)[0][class_index] * 100
        
        orig_prob = round(orig_prob, 1)
        cf_prob = round(cf_prob, 1)
        
        difference = round(cf_prob - orig_prob, 1)
        
        return {
            "success": True,
            "scenario": scenario,
            "orig_prob": orig_prob,
            "cf_prob": cf_prob,
            "difference": difference
        }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        return {"success": False, "error": f"{str(e)} | Trace: {error_trace}"}
