#!/bin/bash
set -e
echo "🧪 Running FairLens AI Test Suite..."

cd "$(dirname "$0")/../backend"
[ -d "venv" ] && source venv/bin/activate
python -m pytest tests/test_api.py -v --tb=short

echo ""
echo "✅ All tests passed!"
