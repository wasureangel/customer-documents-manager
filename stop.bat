@echo off
title CRM - Stopping...

cls
echo ========================================
echo   Stopping CRM Project...
echo ========================================
echo.

echo Killing Node.js processes...
taskkill /F /IM node.exe 2>nul

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo   All services stopped successfully
    echo ========================================
) else (
    echo.
    echo   No running services found
    echo ========================================
)

echo.
timeout /t 2 /nobreak >nul
