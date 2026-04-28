import sys, json, io
# ensure backend package imports work when running from repo root
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from services import dataset_analyzer

csv_path = os.path.join(os.path.dirname(__file__), '..', 'synth_hiring_data.csv')
csv_path = os.path.normpath(csv_path)
print('Loading CSV from:', csv_path)
with open(csv_path, 'rb') as f:
    content = f.read()

res = dataset_analyzer.analyze(content, 'Employed', '["Gender"]')
print(json.dumps(res, indent=2, default=str))
