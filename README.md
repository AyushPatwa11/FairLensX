# FairLens AI v3 — Enterprise Bias Auditing Platform

## Project Structure

```
fairlens-v3/
├── backend/                   # FastAPI Python backend
│   ├── app/
│   │   ├── api/               # Route handlers (endpoints)
│   │   │   ├── dataset.py     # /api/analyze, /api/mitigate
│   │   │   ├── text.py        # /api/analyze-text
│   │   │   ├── simulator.py   # /api/simulate
│   │   │   └── chat.py        # /api/chat (AI assistant)
│   │   ├── services/          # Business logic
│   │   │   ├── bias_service.py      # ML pipeline, metrics
│   │   │   ├── nlp_service.py       # Text bias detection
│   │   │   └── simulator_service.py # Counterfactual logic
│   │   ├── models/            # Pydantic request/response models
│   │   │   └── schemas.py
│   │   ├── utils/             # Shared utilities
│   │   │   └── helpers.py
│   │   └── main.py            # FastAPI app entry point
│   ├── tests/                 # Unit + integration tests
│   │   └── test_api.py
│   ├── data/                  # Sample datasets
│   │   └── sample_hiring.csv
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/                  # React SPA
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── sidebar/       # Sidebar navigation
│   │   │   ├── navbar/        # Top navigation bar
│   │   │   ├── modes/         # Three analysis modes
│   │   │   ├── charts/        # Gauge, bars, donut
│   │   │   ├── shared/        # Reusable UI components
│   │   │   └── assistant/     # AI chat assistant
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # API client, helpers
│   │   ├── config/            # Domain config, themes
│   │   ├── styles/            # CSS design system
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── Dockerfile
├── docker/
│   └── docker-compose.yml
├── scripts/
│   ├── start.sh               # Start both services
│   └── test.sh                # Run all tests
├── docs/
│   ├── API.md                 # API documentation
│   └── SETUP.md               # Setup guide
└── README.md
```

## Quick Start

### Option A — One Command (Docker)
```bash
docker-compose -f docker/docker-compose.yml up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option B — Local Dev
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Option C — Start script
```bash
chmod +x scripts/start.sh && ./scripts/start.sh
```

## API Keys (Optional)
Add to `backend/.env`:
```
GEMINI_API_KEY=AIza...   # Enhanced AI text analysis
```

## Tech Stack
- **Backend**: FastAPI, scikit-learn, pandas, numpy
- **Frontend**: React 18, Recharts, Axios
- **ML**: Random Forest, Inverse Probability Reweighting
- **AI**: Gemini 1.5 Flash (optional), rule-based fallback
