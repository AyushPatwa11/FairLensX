import sys
import os

dependencies = [
    "fastapi",
    "uvicorn",
    "pandas",
    "sklearn",
    "fairlearn",
    "langchain",
    "langchain_google_genai",
    "dotenv"
]

print(f"Python Version: {sys.version}")
print(f"Current Directory: {os.getcwd()}")
print("-" * 20)

for dep in dependencies:
    try:
        if dep == "sklearn":
            import sklearn
        elif dep == "dotenv":
            import dotenv
        else:
            __import__(dep.replace("-", "_"))
        print(f"[OK] {dep} is installed")
    except ImportError:
        print(f"[FAIL] {dep} is NOT installed")
