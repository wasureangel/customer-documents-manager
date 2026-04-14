@echo off
title CRM - Close window to stop

cls
echo ========================================
echo   Starting CRM Project...
echo ========================================
echo.

echo Killing old processes...
taskkill /F /IM node.exe 2>nul

echo [1/2] Starting backend...
cd /d "%~dp0backend"
start /b npm start >nul 2>&1

timeout /t 3 /nobreak >nul

echo [2/2] Starting frontend...
cd /d "%~dp0frontend"
start /b npm run dev >nul 2>&1

cd /d "%~dp0"

timeout /t 2 /nobreak >nul

cls
echo ========================================
echo   CRM is running!
echo ========================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo.
echo   Close this window to stop all services
echo.
echo ========================================
echo.

:loop
timeout /t 60 >nul
goto loop
