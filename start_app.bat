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

echo [1/3] Setting up Backend environment with UV...
cd backend
echo Removing old corrupted environment if it exists...
IF EXIST venv rmdir /s /q venv
echo Creating fresh backend virtual environment...
uv venv venv
echo Installing dependencies using uv...
uv pip install -p venv -r requirements.txt
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install requirements using uv. Please read the error above!
    pause
    exit /b
)
IF EXIST venv\Scripts\python.exe (
    set VENV_PYTHON=venv\Scripts\python.exe
) ELSE (
    set VENV_PYTHON=venv\bin\python.exe
)
cd ..

echo.
echo [2/3] Generating synthetic dataset...
backend\%VENV_PYTHON% generate_data.py

echo.
echo [3/3] Starting the Backend and Frontend...
cd backend
echo Launching FastAPI in a new window...
IF EXIST venv\Scripts\python.exe (
    start "FairLens Backend" cmd /k "venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001 || pause"
) ELSE (
    start "FairLens Backend" cmd /k "venv\bin\python.exe -m uvicorn main:app --reload --port 8001 || pause"
)
cd ..

echo Launching local HTTP server in a new window...
start "FairLens Frontend" cmd /k "python -m http.server 8080"

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

