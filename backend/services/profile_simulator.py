import os
import joblib
import pandas as pd
import numpy as np

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
        
        # Ensure data types match what the model might expect (robustness)
        for df in [orig_data, cf_data]:
            df['Experience'] = float(df['Experience'])
            df['Education'] = str(df['Education'])
            df['Gender'] = str(df['Gender'])
            df['Age'] = str(df['Age'])

        # Predict probability or class
        # Note: Fairlearn mitigators might not support predict_proba
        classifier = model.named_steps["classifier"]
        
        def get_prob(data):
            if hasattr(classifier, "predict_proba"):
                try:
                    # Standard sklearn model
                    classes = list(classifier.classes_)
                    # Try to find the 'positive' class (1, 'Yes', 'Hired')
                    pos_class = classes[-1] 
                    if 1 in classes: pos_class = 1
                    
                    idx = classes.index(pos_class)
                    probs = model.predict_proba(data)[0]
                    return float(probs[idx] * 100)
                except Exception:
                    # Fallback to binary if indexing fails
                    return 100.0 if model.predict(data)[0] == 1 else 0.0
            else:
                # Mitigated model (e.g. ExponentiatedGradient) usually only has .predict()
                # Returns 100% for positive class, 0% for negative
                pred = model.predict(data)[0]
                # Coerce to int/float for comparison
                try:
                    if int(pred) == 1: return 100.0
                except:
                    if str(pred).lower() in ['yes', 'hired', 'true']: return 100.0
                return 0.0

        orig_prob = get_prob(orig_data)
        cf_prob = get_prob(cf_data)
        
        orig_prob = round(orig_prob, 1)
        cf_prob = round(cf_prob, 1)
        
        difference = round(cf_prob - orig_prob, 1)
        
        # Identify which attributes changed
        changed_attributes = []
        if cf_gender != orig_gender:
            changed_attributes.append(f"Gender: {orig_gender} → {cf_gender}")
        if cf_age_val != age_group:
            changed_attributes.append(f"Age: {age_group} → {cf_age_val}")
        if cf_edu_val != education:
            changed_attributes.append(f"Education: {education} → {cf_edu_val}")
            
        # Generate the Full Counterfactual Grid (What-If Matrix)
        genders = ["Male", "Female"]
        ages = ["< 30", "30-50", "> 50"]
        cf_grid = []
        
        for g in genders:
            for a in ages:
                temp_data = pd.DataFrame([{
                    'Experience': float(experience),
                    'Education': str(education),
                    'Gender': str(g),
                    'Age': str(a)
                }])
                prob = get_prob(temp_data)
                cf_grid.append({
                    "Gender": g,
                    "Age": a,
                    "prob": round(prob, 1)
                })
                
        # LLM Personalized Explanation
        llm_explanation = ""
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                from .llm_helper import get_llm_wrapper
                wrapper = get_llm_wrapper(temperature=0.2)
                if wrapper:
                    prompt_text = """You are an expert HR AI assistant. 
A candidate profile has a baseline probability of being hired of {orig_prob}%. 
In the counterfactual scenario, the probability becomes {cf_prob}%. 

What-If Matrix (Demographic Swaps):
{grid_text}

Write 2 concise sentences explaining the bias or fairness detected. Do not use markdown."""
                    grid_text = "\n".join([f"- {item['Gender']}, {item['Age']} -> {item['prob']}%" for item in cf_grid])
                    from langchain_core.prompts import PromptTemplate
                    prompt = PromptTemplate.from_template(prompt_text)
                    response = wrapper.invoke(prompt.format(orig_prob=orig_prob, cf_prob=cf_prob, grid_text=grid_text))
                    llm_explanation = response.content.strip()
                else:
                    llm_explanation = "API Key configured but LLM wrapper initialization failed."
            except Exception as e:
                llm_explanation = f"AI Explanation unavailable: {str(e)}"
        else:
            llm_explanation = "Offline Mode: Provide an API key to receive personalized AI explanations."
        
        return {
            "success": True,
            "scenario": scenario,
            "orig_prob": orig_prob,
            "cf_prob": cf_prob,
            "difference": difference,
            "changed_attributes": changed_attributes if changed_attributes else ["Gender"],
            "cf_grid": cf_grid,
            "llm_explanation": llm_explanation,
            "bias_impact": "High" if abs(difference) > 15 else ("Medium" if abs(difference) > 5 else "Low")
        }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        return {"success": False, "error": f"{str(e)} | Trace: {error_trace}"}
