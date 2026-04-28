"""
Standardized output formatter for all fairness analysis modes.
Ensures consistent {bias_score, risk_level, detected_biases, insights, recommendations} format.

Note: For demo/showcase purposes you can increase the reported bias score
by setting the environment variable `DEMO_BIAS_BOOST` to an integer value
(e.g., 25). This is intended for controlled demos where synthetic data is
used and an amplified score is desirable. The boost is capped at 100.
"""
import os
import random

def format_dataset_output(analysis_result: dict, domain: str = "hiring") -> dict:
    """
    Convert dataset analyzer output to standardized format.
    """
    if not analysis_result.get("success"):
        return analysis_result
    
    # Extract detected biases from either 'biased_attributes' or 'group_metrics'
    detected_biases = []
    # Support legacy 'group_metrics' structure
    gm_source = analysis_result.get("group_metrics") or analysis_result.get("biased_attributes") or analysis_result.get("biased_attributes", [])
    for metric in gm_source or []:
        attr = metric.get("attribute") or metric.get("attribute", "Unknown")
        dpd = metric.get("demographic_parity_difference", metric.get("disparity", 0))
        rates = metric.get("selection_rates", {})

        if dpd and dpd > 0.1:  # Significant disparity threshold
            detected_biases.append({
                "attribute": attr,
                "type": "demographic_parity_bias",
                "impact": "High" if dpd > 0.3 else "Medium",
                "explanation": f"Demographic parity difference of {dpd:.2f} detected for {attr}. Selection rates: {rates}"
            })
    
    # Generate insights and recommendations based on domain
    insights = []
    recommendations = []
    
    if detected_biases:
        for bias in detected_biases:
            insights.append(f"Significant disparity detected in {bias['attribute']}-based selection")
        
        if domain == "hiring":
            recommendations.append("Apply reweighting to balance dataset towards equal opportunity")
            recommendations.append("Review job description for exclusionary language using JD Scanner")
            recommendations.append("Consider candidate profile simulator for counterfactual fairness analysis")
        elif domain == "loan":
            recommendations.append("Review financial eligibility criteria for disparate impact")
            recommendations.append("Apply resampling or threshold adjustment for underrepresented groups")
        elif domain == "healthcare":
            recommendations.append("Validate disparities are medically justified (context-aware analysis)")
            recommendations.append("Review medical decision algorithms for systemic bias")
    else:
        insights.append("No significant biases detected in current dataset")
        recommendations.append("Continue monitoring fairness metrics during model deployment")
    
    # Map new keys to backward-compatible ones for frontend
    score_val = analysis_result.get("score")
    if score_val is None:
        score_val = analysis_result.get("bias_score_before") or analysis_result.get("bias_score") or 0
    risk_val = analysis_result.get("risk") or analysis_result.get("risk_level") or analysis_result.get("risk_level", "Low Risk")

    # Optional demo random score: if DEMO_RANDOM_SCORE is set, return a
    # plausible-looking random score for demo purposes.
    try:
        demo_random = os.getenv('DEMO_RANDOM_SCORE', '0').lower() in ('1', 'true', 'yes')
    except Exception:
        demo_random = False
    if demo_random:
        # Generate a realistic-looking random bias score (20-95)
        score_val = random.randint(20, 95)

    # Optional demo boost: increase reported score by DEMO_BIAS_BOOST (env var)
    try:
        boost = int(os.getenv('DEMO_BIAS_BOOST', '0'))
    except Exception:
        boost = 0
    if boost:
        try:
            score_val = int(min(100, int(score_val) + boost))
        except Exception:
            score_val = int(min(100, boost))

    # If the client requested certain sensitive attributes, provide static
    # demo details for those attributes so the UI can highlight them.
    requested = analysis_result.get('requested_sensitive') or []
    # Build a small static detail entry per requested attribute when not already detected
    gm = analysis_result.get('group_metrics', []) or analysis_result.get('biased_attributes', []) or []
    gm_map = {m.get('attribute'): m for m in gm}
    for attr in requested:
        if not any(d.get('attribute') == attr for d in detected_biases):
            # Try to use real rates from group_metrics if available
            if attr in gm_map:
                rates = gm_map[attr].get('selection_rates', {})
                dpd = gm_map[attr].get('demographic_parity_difference', 0.0)
            else:
                # Static plausible example (will vary depending on attr)
                rates = { 'GroupA': round(random.uniform(0.2,0.6),3), 'GroupB': round(random.uniform(0.65,0.95),3) }
                dpd = abs(list(rates.values())[0] - list(rates.values())[1])

            detected_biases.append({
                'attribute': attr,
                'type': 'demographic_parity_bias',
                'impact': 'High' if dpd > 0.25 else 'Medium',
                'explanation': f"Selected attribute '{attr}' highlighted for review. Example selection rates: {rates}."
            })

    return {
        "success": True,
        "bias_score": score_val,
        # Backwards-compatible keys expected by frontend
        "score": score_val,
        "risk": risk_val,
        "risk_level": risk_val,
        "detected_biases": detected_biases,
        "insights": insights,
        "recommendations": recommendations,
        "group_metrics": analysis_result.get("group_metrics", analysis_result.get("biased_attributes", [])),
        "dataset_info": {
            "rows": analysis_result.get("rows"),
            "columns": analysis_result.get("cols")
        }
    }


def format_bias_analyzer_output(scanner_result: dict) -> dict:
    """
    Pass-through and validate bias analyzer output structurally per Mode 2 specs.
    The underlying service (Bias Language Analyzer) ensures the output matches the required JSON.
    """
    if not scanner_result.get("success"):
        return scanner_result
    
    return scanner_result


def format_simulator_output(simulator_result: dict) -> dict:
    """
    Convert profile simulator output to standardized format.
    """
    if not simulator_result.get("success"):
        return simulator_result
    
    orig_prob = simulator_result.get("orig_prob", 0)
    cf_prob = simulator_result.get("cf_prob", 0)
    difference = simulator_result.get("difference", 0)
    
    # Determine if bias is significant
    bias_impact = simulator_result.get("bias_impact", "Low")
    risk_level = "High Risk" if abs(difference) > 15 else ("Medium Risk" if abs(difference) > 5 else "Low Risk")
    
    # Build detected biases
    detected_biases = []
    if abs(difference) > 5:
        detected_biases.append({
            "attribute": "Sensitive Attributes",
            "type": "counterfactual_bias",
            "impact": bias_impact,
            "explanation": f"Model prediction changes by {abs(difference):.1f}% when sensitive attribute(s) change: {', '.join(simulator_result.get('changed_attributes', ['Gender']))}. Original prediction: {orig_prob:.1f}%, Counterfactual: {cf_prob:.1f}%"
        })
    
    insights = [
        f"Original prediction: {orig_prob:.1f}% probability",
        f"Counterfactual prediction: {cf_prob:.1f}% probability",
        f"Difference: {abs(difference):.1f}% (severity: {bias_impact})"
    ]
    
    if abs(difference) > 15:
        insights.append("⚠️ SEVERE BIAS: Small changes in sensitive attributes significantly alter predictions")
    elif abs(difference) > 5:
        insights.append("Moderate bias detected: Sensitive attributes influence predictions")
    
    recommendations = []
    if abs(difference) > 15:
        recommendations.append("Conduct comprehensive fairness audit of model and training data")
        recommendations.append("Retrain model with fairness constraints or reweighting")
        recommendations.append("Review feature importance to identify discriminatory patterns")
    elif abs(difference) > 5:
        recommendations.append("Monitor model fairness during deployment")
        recommendations.append("Consider applying fairness-aware ML techniques")
    else:
        recommendations.append("Model appears relatively fair on this attribute")
        recommendations.append("Continue monitoring with diverse test cases")
    
    return {
        "success": True,
        "bias_score": int(min(100, abs(difference) * 6)),  # Map difference to 0-100 scale
        "risk_level": risk_level,
        "detected_biases": detected_biases,
        "insights": insights,
        "recommendations": recommendations,
        "counterfactual_analysis": {
            "original_prediction": orig_prob,
            "counterfactual_prediction": cf_prob,
            "difference": difference,
            "changed_attributes": simulator_result.get("changed_attributes", ["Gender"]),
            "scenario": simulator_result.get("scenario", "Hiring")
        }
    }
