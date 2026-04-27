"""
Context-aware validation of requirements to distinguish legitimate constraints from unjustified bias.
Domain-specific rules for hiring, loan, healthcare, and education domains.
"""

DOMAIN_CONTEXT_RULES = {
    "hiring": {
        "allow_physical_constraints": {
            "firefighter": ["tall", "physically capable", "fit"],
            "pilot": ["height", "vision"],
            "athlete": ["athletic", "strong"],
        },
        "legitimate_requirements": [
            "bilingual (job-specific)",
            "experience (years)",
            "technical skills",
            "degree requirement",
            "security clearance",
            "travel requirement",
        ],
        "discriminatory_patterns": [
            "young",
            "digital native",
            "recent graduate",
            "aggressive",
            "dominant",
            "rockstar",
            "ninja",
            "attractive",
            "elite school",
            "ivy league",
            "native speaker",
        ]
    },
    "loan": {
        "allow_financial_attributes": True,
        "legitimate_requirements": [
            "credit score",
            "income level",
            "employment type",
            "debt-to-income ratio",
            "collateral",
            "payment history",
        ],
        "must_evaluate": [
            "income",
            "age",
            "employment_status",
            "credit_score",
        ]
    },
    "healthcare": {
        "medically_justifiable": [
            "age (certain conditions)",
            "medical history",
            "blood type",
            "genetic markers",
            "BMI (in specific contexts)",
        ],
        "must_evaluate": [
            "age",
            "gender",
            "race (some medical contexts)",
            "socio-economic status",
        ]
    },
    "education": {
        "legitimate_requirements": [
            "test scores",
            "GPA",
            "essay",
            "extracurriculars",
            "recommendation letters",
        ],
        "must_evaluate": [
            "school quality",
            "socio-economic background",
            "first-generation status",
            "geography",
        ]
    }
}


def validate_requirement(requirement: str, domain: str = "hiring") -> dict:
    """
    Validate if a requirement is legitimate or discriminatory based on domain context.
    
    Returns:
    {
        "valid": bool,
        "category": "legitimate" | "discriminatory" | "context-dependent",
        "explanation": str,
        "recommendation": str
    }
    """
    requirement_lower = requirement.lower().strip()
    
    rules = DOMAIN_CONTEXT_RULES.get(domain, {})
    
    # Check if it's a discriminatory pattern
    discriminatory = rules.get("discriminatory_patterns", [])
    for pattern in discriminatory:
        if pattern in requirement_lower:
            return {
                "valid": False,
                "category": "discriminatory",
                "explanation": f"'{pattern}' is recognized as biased language in {domain} domain",
                "recommendation": f"Replace with inclusive alternative. For example, '{pattern}' could be '{_get_replacement(pattern)}'"
            }
    
    # Check if it's legitimate
    legitimate = rules.get("legitimate_requirements", [])
    for req in legitimate:
        if req.lower() in requirement_lower:
            return {
                "valid": True,
                "category": "legitimate",
                "explanation": f"'{req}' is a recognized legitimate requirement in {domain} domain",
                "recommendation": "This requirement is job-related and justified"
            }
    
    # Check if physical constraint is allowed for specific roles
    if domain == "hiring":
        physical_constraints = rules.get("allow_physical_constraints", {})
        for role, allowed_attrs in physical_constraints.items():
            if role.lower() in requirement_lower:
                for attr in allowed_attrs:
                    if attr in requirement_lower:
                        return {
                            "valid": True,
                            "category": "context-dependent",
                            "explanation": f"'{attr}' may be justified for {role} role",
                            "recommendation": "Ensure this constraint is truly BFOQ (Bona Fide Occupational Qualification)"
                        }
    
    # Default: insufficient information
    return {
        "valid": None,
        "category": "context-dependent",
        "explanation": f"Requirement '{requirement}' requires manual review for {domain} domain",
        "recommendation": "Ensure requirement is job-related and apply uniformly to all candidates"
    }


def _get_replacement(biased_word: str) -> str:
    """Get recommended inclusive replacement for biased term."""
    replacements = {
        "young": "early-career",
        "digital native": "comfortable with technology",
        "recent graduate": "entry-level",
        "aggressive": "proactive",
        "dominant": "collaborative",
        "rockstar": "high-performing",
        "ninja": "specialist",
        "attractive": "professional appearance",
        "elite school": "strong academic background",
        "ivy league": "top-tier university",
        "native speaker": "fluent in language",
    }
    return replacements.get(biased_word, "inclusive alternative")


def validate_context_rules(data: dict, domain: str = "hiring") -> dict:
    """
    Comprehensive context rule validation for analysis results.
    
    Checks if detected biases are justified by domain-specific context.
    """
    results = {
        "domain": domain,
        "validated_biases": [],
        "unjustified_biases": [],
        "context_dependent": []
    }
    
    rules = DOMAIN_CONTEXT_RULES.get(domain, {})
    
    detected_biases = data.get("detected_biases", [])
    for bias in detected_biases:
        bias_type = bias.get("type", "")
        attribute = bias.get("attribute", "")
        
        # Check if this is context-justifiable
        if domain == "healthcare" and attribute in rules.get("medically_justifiable", []):
            results["context_dependent"].append({
                "bias": bias,
                "reason": "This attribute may have medical justification - requires manual review"
            })
        elif bias_type == "legitimate":
            results["validated_biases"].append({
                "bias": bias,
                "reason": "Recognized as legitimate requirement in domain"
            })
        else:
            results["unjustified_biases"].append({
                "bias": bias,
                "reason": "No domain-specific justification found"
            })
    
    return results
