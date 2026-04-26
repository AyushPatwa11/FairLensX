import sys
import os
import json

# add backend to path
sys.path.append(os.path.abspath(r"c:\programming files of my\hack2skill\build with ai\backend"))

from services import dataset_analyzer

csv_content = """Experience,Education,Gender,Age,Hired
2,Bachelors,Female,30-50,0
5,Masters,Male,30-50,1
3,Bachelors,Male,<30,1
6,PhD,Female,>50,1
1,Bachelors,Female,<30,0
4,Masters,Male,>50,1
"""

target = "Hired"
sensitive = json.dumps(["Gender", "Age"])

result = dataset_analyzer.analyze(csv_content.encode('utf-8'), target, sensitive)
print(result)
