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
        # Predict probability of positive class
        pos_class = model.named_steps["classifier"].classes_[-1]
        class_index = list(model.named_steps["classifier"].classes_).index(pos_class)
        
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
            
        # Generate the Full Counterfactual Grid (What-If Matrix)
        genders = ["Male", "Female"]
        ages = ["< 30", "30-50", "> 50"]
        cf_grid = []
        
        for g in genders:
            for a in ages:
                temp_data = pd.DataFrame([{
                    'Experience': experience,
                    'Education': education,
                    'Gender': g,
                    'Age': a
                }])
                prob = model.predict_proba(temp_data)[0][class_index] * 100
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
                from langchain_google_genai import ChatGoogleGenerativeAI
                from langchain_core.prompts import PromptTemplate
                
                llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.2)
                
                prompt_text = """You are an expert HR AI assistant. 
A candidate profile has a baseline probability of being hired of {orig_prob}%. 
When checking the alternative scenario, the probability becomes {cf_prob}%. 

Here is the full matrix of probabilities for this exact candidate based purely on demographic swaps (holding experience/education constant):
{grid_text}

Write 2 concise, highly personalized sentences explaining how their demographic background is influencing the algorithmic decision. Focus on the penalty or boost they are receiving. Do not use markdown, just plain text.
"""
                grid_text = "\n".join([f"- Gender: {item['Gender']}, Age: {item['Age']} -> {item['prob']}%" for item in cf_grid])
                
                prompt = PromptTemplate.from_template(prompt_text)
                response = llm.invoke(prompt.format(orig_prob=orig_prob, cf_prob=cf_prob, grid_text=grid_text))
                llm_explanation = response.content.strip()
            except Exception as e:
                llm_explanation = f"Failed to generate AI explanation: {str(e)}"
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
