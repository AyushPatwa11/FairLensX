#!/bin/bash
set -e
echo "🚀 Starting FairLens AI v3..."

# Backend
cd "$(dirname "$0")/../backend"
if [ ! -d "venv" ]; then
  echo "📦 Creating Python virtual environment..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
echo "✅ Backend dependencies installed"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "✅ Backend started at http://localhost:8000"
echo "📖 API docs at http://localhost:8000/docs"

# Wait for backend
sleep 2

# Frontend
cd "$(dirname "$0")/../frontend"
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi
echo "✅ Starting frontend..."
REACT_APP_API_URL=http://localhost:8000 npm start &
FRONTEND_PID=$!
echo "✅ Frontend starting at http://localhost:3000"

echo ""
echo "════════════════════════════════════════"
echo "  FairLens AI is running!"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo "  Press Ctrl+C to stop"
echo "════════════════════════════════════════"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
