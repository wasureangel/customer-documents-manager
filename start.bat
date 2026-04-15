@echo off
title CRM - Close window to stop

cls
echo ========================================
echo   Starting CRM Project...
echo ========================================
echo.

echo Killing old processes...
taskkill /F /IM node.exe 2>nul

echo [1/1] Starting server...
cd /d "%~dp0backend"
start /b npm start >nul 2>&1

cd /d "%~dp0"

timeout /t 3 /nobreak >nul

cls
echo ========================================
echo   CRM is running!
echo ========================================
echo.
echo   Local:    http://localhost:3001
echo   Network:  http://[Your-IP]:3001
echo.
echo   Close this window to stop all services
echo.
echo ========================================
echo.

:loop
timeout /t 60 >nul
goto loop
