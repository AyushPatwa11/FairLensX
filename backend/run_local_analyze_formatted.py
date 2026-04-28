import sys, os, io, json
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from services import dataset_analyzer
from services.fairness_output_formatter import format_dataset_output

csv_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'synth_hiring_data.csv'))
print('Loading CSV from:', csv_path)
with open(csv_path, 'rb') as f:
    content = f.read()

raw = dataset_analyzer.analyze(content, 'Employed', '["Gender"]')
print('Raw analyzer result keys:', list(raw.keys()))
formatted = format_dataset_output(raw, domain='hiring')
print(json.dumps(formatted, indent=2))
