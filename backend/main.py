from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()

from services import dataset_analyzer, jd_scanner, profile_simulator, agent_orchestrator
from services.fairness_output_formatter import format_dataset_output, format_jd_output, format_simulator_output
from services.context_rules import validate_context_rules

app = FastAPI(title="FairLens AI Backend")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()] or ["*"]
allow_credentials = "*" not in allowed_origins

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/dataset/analyze")
async def analyze_dataset(
    file: UploadFile = File(...),
    target: str = Form(...),
    sensitive: str = Form(...),
    domain: str = Form("hiring")
):
    # Read the CSV content
    content = await file.read()
    result = dataset_analyzer.analyze(content, target, sensitive)
    # Apply standardized output formatting
    return format_dataset_output(result, domain=domain)

@app.post("/api/dataset/mitigate")
async def mitigate_dataset():
    # In a real app we'd pass state/session ID. Here we just return dummy mitigated data.
    return dataset_analyzer.mitigate()

@app.post("/api/jd/scan")
async def scan_jd(text: str = Form(...), domain: str = Form("hiring")):
    result = jd_scanner.scan(text)
    # Apply standardized output formatting
    return format_jd_output(result, domain=domain)

@app.post("/api/profile/simulate")
async def simulate_profile(
    experience: int = Form(...),
    education: str = Form(...),
    orig_gender: str = Form(...),
    cf_gender: str = Form(...),
    scenario: str = Form("Hiring"),
    age_group: str = Form("30-50"),
    cf_age: str = Form(None),
    cf_education: str = Form(None),
    cf_location: str = Form(None),
    domain: str = Form("hiring")
):
    result = profile_simulator.simulate(
        experience, education, orig_gender, cf_gender, 
        scenario=scenario, age_group=age_group,
        cf_age=cf_age, cf_education=cf_education, cf_location=cf_location
    )
    # Apply standardized output formatting
    return format_simulator_output(result)

@app.post("/api/agent/chat")
async def chat_with_agent(message: str = Form(...)):
    reply = agent_orchestrator.chat_with_agent(message)
    return {"success": True, "reply": reply}

@app.post("/api/context/validate")
async def validate_context(analysis_result: dict, domain: str = "hiring"):
    """
    Validate analysis results against domain-specific context rules.
    Distinguishes justified constraints from unjustified bias.
    """
    validation = validate_context_rules(analysis_result, domain=domain)
    return {
        "success": True,
        "validation_result": validation,
        "summary": {
            "total_biases": len(analysis_result.get("detected_biases", [])),
            "justified": len(validation.get("validated_biases", [])),
            "unjustified": len(validation.get("unjustified_biases", [])),
            "requires_review": len(validation.get("context_dependent", []))
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
