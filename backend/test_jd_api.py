import requests
import json

API = "http://127.0.0.1:8001/api/jd/scan"

data = {
    'text': "We are hiring a young, energetic salesperson. Must be able to lift and move boxes.",
    'domain': 'Hiring',
    'context_rules': json.dumps({'allow_physical_constraints': False})
}

print('Posting to', API)
resp = requests.post(API, data=data, timeout=30)
print('Status:', resp.status_code)
try:
    print('JSON:', json.dumps(resp.json(), indent=2))
except Exception:
    print('Response text:', resp.text)
