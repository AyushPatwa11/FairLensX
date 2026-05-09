#!/usr/bin/env python3
"""Send sample CSV to backend /api/analyze with multiple sensitive columns."""
import os
import requests

URL = "http://127.0.0.1:8000/api/analyze"
CSV_PATH = os.path.join("backend", "temp_sample.csv")

def main():
    if not os.path.exists(CSV_PATH):
        print(f"CSV not found: {CSV_PATH}")
        return 2
    with open(CSV_PATH, "rb") as f:
        files = {"file": (os.path.basename(CSV_PATH), f, "text/csv")}
        data = {
            "target_column": "hired",
            "sensitive_columns": '["gender","race"]',
            "domain": "hiring",
        }
        try:
            r = requests.post(URL, files=files, data=data, timeout=60)
        except Exception as e:
            print("Request failed:", e)
            return 3
    print("Status:", r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
