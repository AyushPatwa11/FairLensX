"""
FairLens AI — FastAPI Application Entry Point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.api import dataset, text, simulator, chat

load_dotenv()

app = FastAPI(
    title="FairLens AI API",
    version="3.0.0",
    description="Enterprise AI Bias Auditing Platform — Dataset, Text & Individual Simulation",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset.router,   prefix="/api", tags=["Dataset Analysis"])
app.include_router(text.router,      prefix="/api", tags=["Text Analysis"])
app.include_router(simulator.router, prefix="/api", tags=["Bias Simulator"])
app.include_router(chat.router,      prefix="/api", tags=["AI Assistant"])


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "version": "3.0.0", "service": "FairLens AI"}


@app.get("/", tags=["System"])
def root():
    return {
        "name": "FairLens AI API",
        "version": "3.0.0",
        "docs": "/docs",
        "endpoints": {
            "dataset":   "POST /api/analyze, POST /api/mitigate",
            "text":      "POST /api/analyze-text",
            "simulator": "POST /api/simulate",
            "chat":      "POST /api/chat",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )
