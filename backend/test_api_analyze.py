import requests, os, json

BASE = "http://127.0.0.1:8001"
URL = BASE + "/api/dataset/analyze"
file_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'synth_hiring_data.csv'))
print('Posting file:', file_path)
with open(file_path, 'rb') as f:
    files = {'file': ('synth_hiring_data.csv', f, 'text/csv')}
    data = {'target': 'Employed', 'sensitive': '["Gender"]'}
    resp = requests.post(URL, files=files, data=data, timeout=60)
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print('Status:', resp.status_code)
        print(resp.text)
