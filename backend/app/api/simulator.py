"""FairLens AI — Bias Simulator API — POST /api/simulate"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import SimulateRequest
from app.services.simulator_service import predict, counterfactual

router = APIRouter()

@router.post("/simulate")
async def simulate(req: SimulateRequest):
    if not req.profile:
        raise HTTPException(400, "Profile cannot be empty")
    pred = predict(req.profile, req.domain)
    cfs  = counterfactual(req.profile, req.domain, pred["probability"])
    max_delta = max((abs(c["delta"]) for c in cfs), default=0)
    return {**pred, "counterfactuals": cfs, "bias_detected": max_delta > 0.08, "max_delta": round(max_delta, 4)}
