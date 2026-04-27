import os
import json
from urllib.request import urlopen, Request

def get_key():
    path = os.path.join(os.path.dirname(__file__), '..', '.env')
    path = os.path.normpath(path)
    key = None
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip().startswith('GOOGLE_API_KEY'):
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        key = parts[1].strip()
                        break
    except Exception:
        pass
    if not key:
        key = os.environ.get('GOOGLE_API_KEY')
    return key

key = get_key()
if not key:
    print('ERROR: GOOGLE_API_KEY not found in backend/.env or environment')
    raise SystemExit(2)

url = f'https://generativelanguage.googleapis.com/v1/models?key={key}'
req = Request(url, headers={"User-Agent": "python-urllib/3"})
try:
    with urlopen(req, timeout=30) as resp:
        body = resp.read().decode('utf-8')
        try:
            parsed = json.loads(body)
            print(json.dumps(parsed, indent=2))
        except Exception:
            print(body)
except Exception as e:
    print('ERROR calling ListModels:', e)
    raise
