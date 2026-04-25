from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

load_dotenv()

from services import dataset_analyzer, jd_scanner, profile_simulator, agent_orchestrator

app = FastAPI(title="FairLens AI Backend")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/dataset/analyze")
async def analyze_dataset(
    file: UploadFile = File(...),
    target: str = Form(...),
    sensitive: str = Form(...)
):
    # Read the CSV content
    content = await file.read()
    return dataset_analyzer.analyze(content, target, sensitive)

@app.post("/api/dataset/mitigate")
async def mitigate_dataset():
    # In a real app we'd pass state/session ID. Here we just return dummy mitigated data.
    return dataset_analyzer.mitigate()

@app.post("/api/jd/scan")
async def scan_jd(text: str = Form(...)):
    return jd_scanner.scan(text)

@app.post("/api/profile/simulate")
async def simulate_profile(
    experience: int = Form(...),
    education: str = Form(...),
    orig_gender: str = Form(...),
    cf_gender: str = Form(...)
):
    return profile_simulator.simulate(experience, education, orig_gender, cf_gender)

@app.post("/api/agent/chat")
async def chat_with_agent(message: str = Form(...)):
    reply = agent_orchestrator.chat_with_agent(message)
    return {"success": True, "reply": reply}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
