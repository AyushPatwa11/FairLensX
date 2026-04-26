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
        # model.classes_ usually has [0, 1]. We want the index of 1.
        class_index = list(model.classes_).index(1) if 1 in model.classes_ else 1
        
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
        return {"success": False, "error": str(e)}
