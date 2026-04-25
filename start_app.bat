@echo off
cd /d "%~dp0"
echo =========================================
echo    Starting FairLens AI Full-Stack App
echo =========================================
echo.
echo.
echo [0/3] Cleaning up any previous instances...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :8000 ^| findstr LISTENING') DO (taskkill /F /PID %%T >nul 2>&1)
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :8080 ^| findstr LISTENING') DO (taskkill /F /PID %%T >nul 2>&1)

echo [1/3] Setting up Backend environment...
cd backend
IF NOT EXIST venv (
    echo Creating backend virtual environment...
    python -m venv venv
)
echo Activating virtual environment and verifying dependencies...
IF EXIST venv\Scripts\python.exe (
    set VENV_PYTHON=venv\Scripts\python.exe
) ELSE (
    set VENV_PYTHON=venv\bin\python.exe
)
echo Upgrading pip...
%VENV_PYTHON% -m pip install --upgrade pip
echo Installing dependencies (this may take a minute)...
%VENV_PYTHON% -m pip install -r requirements.txt
cd ..

echo.
echo [2/3] Generating synthetic dataset...
backend\%VENV_PYTHON% generate_data.py

echo.
echo [3/3] Starting the Backend and Frontend...
cd backend
echo Launching FastAPI in a new window...
IF EXIST venv\Scripts\python.exe (
    start "FairLens Backend" cmd /k "venv\Scripts\python.exe -m uvicorn main:app --reload"
) ELSE (
    start "FairLens Backend" cmd /k "venv\bin\python.exe -m uvicorn main:app --reload"
)
cd ..

echo Launching local HTTP server in a new window...
start "FairLens Frontend" cmd /k "python -m http.server 8080"

echo.
echo =========================================
echo    App is successfully starting!
echo    Backend running on: http://127.0.0.1:8000
echo    Frontend running on: http://localhost:8080
echo =========================================
echo.

echo Opening your browser to the frontend...
timeout /t 3 /nobreak > NUL
start http://localhost:8080

