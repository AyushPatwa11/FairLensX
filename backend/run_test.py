import subprocess

try:
    result = subprocess.run(
        ["python", "test_analyzer.py"],
        cwd=r"c:\programming files of my\hack2skill\build with ai\backend",
        capture_output=True,
        text=True
    )
    with open(r"c:\programming files of my\hack2skill\build with ai\backend\test_output.txt", "w") as f:
        f.write("STDOUT:\n")
        f.write(result.stdout)
        f.write("\nSTDERR:\n")
        f.write(result.stderr)
except Exception as e:
    with open(r"c:\programming files of my\hack2skill\build with ai\backend\test_output.txt", "w") as f:
        f.write(str(e))
