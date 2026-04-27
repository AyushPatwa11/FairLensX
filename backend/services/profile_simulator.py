import os
import joblib
import pandas as pd

def simulate(experience: int, education: str, orig_gender: str, cf_gender: str, scenario: str = "Hiring", age_group: str = "30-50", 
             cf_age: str = None, cf_education: str = None, cf_location: str = None):
    """
    Perform counterfactual analysis on profile, supporting multiple sensitive attributes.
    If cf_age, cf_education, cf_location are None, use the original values.
    """
    model_path = "models/latest_model.pkl"
    
    if not os.path.exists(model_path):
        return {
            "success": False,
            "error": "No trained model found. Please run the Dataset Analyzer (Mode 1) first to train the model."
        }
        
    try:
        model = joblib.load(model_path)
        
        # Use counterfactual values if provided, else use originals
        cf_age_val = cf_age if cf_age else age_group
        cf_edu_val = cf_education if cf_education else education
        
        # Original profile
        orig_data = pd.DataFrame([{
            'Experience': experience,
            'Education': education,
            'Gender': orig_gender,
            'Age': age_group
        }])
        
        # Counterfactual profile (with one or more attributes changed)
        cf_data = pd.DataFrame([{
            'Experience': experience,
            'Education': cf_edu_val,
            'Gender': cf_gender,
            'Age': cf_age_val
        }])
        
        # Predict probability of positive class (Hired = 1)
        class_index = list(model.classes_).index(1) if 1 in model.classes_ else 1
        
        orig_prob = model.predict_proba(orig_data)[0][class_index] * 100
        cf_prob = model.predict_proba(cf_data)[0][class_index] * 100
        
        orig_prob = round(orig_prob, 1)
        cf_prob = round(cf_prob, 1)
        
        difference = round(cf_prob - orig_prob, 1)
        
        # Identify which attributes changed for detailed explanation
        changed_attributes = []
        if cf_gender != orig_gender:
            changed_attributes.append(f"Gender: {orig_gender} → {cf_gender}")
        if cf_age_val != age_group:
            changed_attributes.append(f"Age: {age_group} → {cf_age_val}")
        if cf_edu_val != education:
            changed_attributes.append(f"Education: {education} → {cf_edu_val}")
        
        return {
            "success": True,
            "scenario": scenario,
            "orig_prob": orig_prob,
            "cf_prob": cf_prob,
            "difference": difference,
            "changed_attributes": changed_attributes if changed_attributes else ["Gender"],
            "bias_impact": "High" if abs(difference) > 15 else ("Medium" if abs(difference) > 5 else "Low")
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
