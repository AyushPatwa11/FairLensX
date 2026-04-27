@echo off
cd /d "%~dp0"
echo =========================================
echo    Starting FairLens AI Full-Stack App
echo =========================================
echo.
echo.
echo [0/3] Cleaning up any previous instances...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :8001 ^| findstr LISTENING') DO (taskkill /F /PID %%T >nul 2>&1)
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :8080 ^| findstr LISTENING') DO (taskkill /F /PID %%T >nul 2>&1)

echo [1/3] Setting up Backend environment...
echo Skipping virtual environment setup (dependencies already installed globally).

echo.
echo [2/3] Generating synthetic dataset...
"C:\Users\DEEPESH\AppData\Local\Programs\Python\Python311\python.exe" generate_data.py

echo.
echo [3/3] Starting the Backend and Frontend...
cd backend
echo Launching FastAPI in a new window...
start "FairLens Backend" cmd /k ""C:\Users\DEEPESH\AppData\Local\Programs\Python\Python311\python.exe" -m uvicorn main:app --reload --port 8001 || pause"
cd ..

echo Launching local HTTP server in a new window...
start "FairLens Frontend" cmd /k ""C:\Users\DEEPESH\AppData\Local\Programs\Python\Python311\python.exe" -m http.server 8080"

echo.
echo =========================================
echo    App is successfully starting!
echo    Backend running on: http://127.0.0.1:8001
echo    Frontend running on: http://localhost:8080
echo =========================================
echo.

echo Opening your browser to the frontend...
timeout /t 3 /nobreak > NUL
start http://localhost:8080

