@echo off
title Book Bridge Django Server Starter
echo ==================================================
echo   📚 BOOK BRIDGE PYTHON DJANGO SERVER STARTER 📚
echo ==================================================
echo.

:: Check Python
echo Checking Python installation...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ [ERROR] Python was not found on your system!
    echo Please install Python 3.10+ to run the BookBridgee Django server.
    echo Starting fallback native PowerShell web server...
    powershell -NoProfile -ExecutionPolicy Bypass -File server.ps1
    pause
    exit /b
)

echo.
echo ✅ Python detected!
echo Preparing Django environment and database...

python -m pip install -q -r backend/requirements.txt
python backend/manage.py makemigrations
python backend/manage.py migrate
python backend/manage.py seed_db

echo.
echo 🚀 Starting Django backend server on port 8000...
echo 🌐 Opening http://localhost:8000/browse in your browser...
echo.

start http://localhost:8000/browse

python backend/manage.py runserver 0.0.0.0:8000

pause
