@echo off
title BookBridge 2.0 Production Server Starter
echo ==================================================
echo   📚 BOOKBRIDGE 2.0 PRODUCTION SERVER STARTER 📚
echo ==================================================
echo.

:: Check Node.js
echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ [NOTICE] Node.js was not found in PATH!
    echo Starting fallback native PowerShell web server on port 8080...
    powershell -NoProfile -ExecutionPolicy Bypass -File server.ps1
    pause
    exit /b
)

echo ✅ Node.js detected!
node -v

echo.
echo [2/3] Checking Node dependencies...
if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
)

echo.
echo [3/3] Starting BookBridge Production Server on port 8000...
echo 🌐 Opening http://localhost:8000/browse.html in your default browser...
echo.

start http://localhost:8000/browse.html

npm start

pause
