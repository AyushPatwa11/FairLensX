from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()

from services import dataset_analyzer, profile_simulator, agent_orchestrator
from services import bias_language_analyzer
from services.fairness_output_formatter import format_dataset_output, format_bias_analyzer_output, format_simulator_output
from services.context_rules import validate_context_rules
import json

app = FastAPI(title="FairLens AI Backend")

# Fallback dev middleware: ensure CORS headers are present on all API responses
# This is a safety net for local development in case CORSMiddleware is not applied
# correctly by environment configuration.
from fastapi.responses import Response


@app.middleware("http")
async def ensure_cors_headers(request, call_next):
    # Handle preflight OPTIONS quickly with CORS headers
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE",
            "Access-Control-Allow-Headers": "Authorization,Content-Type",
        }
        return Response(status_code=200, headers=headers)

    response = await call_next(request)
    # Only add headers for API routes to avoid interfering with other responses
    try:
        path = request.url.path
    except Exception:
        path = None

    if path and path.startswith("/api/"):
        response.headers.setdefault("Access-Control-Allow-Origin", "*")
        response.headers.setdefault("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE")
        response.headers.setdefault("Access-Control-Allow-Headers", "Authorization,Content-Type")
    return response


# Explicit OPTIONS preflight handler for all API routes as a fallback
@app.options("/api/{rest_of_path:path}")
async def options_preflight(rest_of_path: str):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE",
        "Access-Control-Allow-Headers": "Authorization,Content-Type",
    }
    return Response(status_code=200, headers=headers)

# Host/port configurable via environment variables for flexibility in dev/containers
# Defaults to 0.0.0.0 so the API is reachable when run inside containers/VMs.
FAIRLENS_HOST = os.getenv("FAIRLENS_HOST", os.getenv("HOST", "0.0.0.0"))
try:
    FAIRLENS_PORT = int(os.getenv("FAIRLENS_PORT", os.getenv("PORT", 8001)))
except ValueError:
    FAIRLENS_PORT = 8001

# Parse allowed origins. If not set or set to '*' then allow all origins (note: allow_credentials
# will be disabled for wildcard origins for security and to comply with browsers).
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if not allowed_origins_env or allowed_origins_env.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

allow_credentials = False if "*" in allowed_origins else True

# Allow CORS for frontend
# Ensure common local frontend origins are allowed by default when a specific list
# is provided (helps avoid localhost vs 127.0.0.1 mismatches during development).
if "*" not in allowed_origins:
    dev_frontend_defaults = ["http://localhost:8080", "http://127.0.0.1:8080"]
    for dev_origin in dev_frontend_defaults:
        if dev_origin not in allowed_origins:
            allowed_origins.append(dev_origin)

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
    try:
        content = await file.read()
        result = dataset_analyzer.analyze(content, target, sensitive)
        # If analyzer returned an error, log full traceback to disk for debugging
        try:
            if not result.get('success'):
                log_dir = os.path.join(os.path.dirname(__file__), 'logs')
                os.makedirs(log_dir, exist_ok=True)
                log_path = os.path.join(log_dir, 'analyzer_errors.log')
                with open(log_path, 'a', encoding='utf-8') as fh:
                    fh.write('\n---- Analyzer Error ----\n')
                    fh.write('Target: ' + str(target) + '\n')
                    fh.write('Sensitive: ' + str(sensitive) + '\n')
                    fh.write(result.get('traceback', str(result)) + '\n')
        except Exception:
            pass
        # Apply standardized output formatting
        return format_dataset_output(result, domain=domain)
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        # write unexpected exception to logs as well
        try:
            log_dir = os.path.join(os.path.dirname(__file__), 'logs')
            os.makedirs(log_dir, exist_ok=True)
            log_path = os.path.join(log_dir, 'analyzer_errors.log')
            with open(log_path, 'a', encoding='utf-8') as fh:
                fh.write('\n---- Analyzer Exception ----\n')
                fh.write('Target: ' + str(target) + '\n')
                fh.write('Sensitive: ' + str(sensitive) + '\n')
                fh.write(tb + '\n')
        except Exception:
            pass
        # Return traceback in response to aid local debugging (safe for local dev only)
        return {"success": False, "error": "Internal server error during analysis.", "exception": str(e), "traceback": tb}

@app.post("/api/dataset/mitigate")
async def mitigate_dataset():
    # In a real app we'd pass state/session ID. Here we just return dummy mitigated data.
    return dataset_analyzer.mitigate()

@app.post("/api/jd/scan")
async def scan_jd(
    text: str = Form(...), 
    domain: str = Form("hiring"),
    context_rules: str = Form(None)
):
    ctx = None
    if context_rules:
        try:
            ctx = json.loads(context_rules)
        except:
            pass
            
    result = bias_language_analyzer.scan(text, domain=domain, context_rules=ctx)
    return format_bias_analyzer_output(result)

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
    uvicorn.run("main:app", host=FAIRLENS_HOST, port=FAIRLENS_PORT, reload=True)
