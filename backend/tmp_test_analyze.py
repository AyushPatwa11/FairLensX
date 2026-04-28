import sys, json
sys.path.append('.')
from services import dataset_analyzer
with open('../synth_hiring_data.csv','rb') as f:
    content=f.read()
res = dataset_analyzer.analyze(content, 'Hired', '["Gender"]')
print(json.dumps(res, indent=2))
