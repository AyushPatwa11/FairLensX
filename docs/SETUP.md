# FairLens AI v3 — Setup Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- Git

## Option A: One-Command Docker (Recommended)
```bash
git clone <repo>
cd fairlens-v3
docker-compose -f docker/docker-compose.yml up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Option B: Start Script
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

## Option C: Manual Setup

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Optional: add GEMINI_API_KEY to .env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

## Adding Gemini API Key (Optional)

For enhanced AI text analysis and smarter chat:

1. Get a free API key at https://ai.google.dev
2. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=AIza...
   ```
3. OR paste the key directly in the Settings panel (⚙️ icon in the app top bar)

## Running Tests
```bash
cd backend
source venv/bin/activate
python -m pytest tests/test_api.py -v
```

## Project Structure
See README.md for full folder structure.

## Domains Supported
- hiring: Hiring & Recruitment decisions
- loan: Loan & Credit approvals
- healthcare: Healthcare referrals
- education: College admissions

## Themes Available
Dark · Light · Ocean · Forest · Sunset · Purple · Midnight · Rose
(click 🎨 in the top bar to switch)
