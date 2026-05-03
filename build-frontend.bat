@echo off
title Build Frontend

cls
echo ========================================
echo   Building Frontend...
echo ========================================
echo.

cd /d "%~dp0frontend"
call npm run build

cd /d "%~dp0"

cls
echo ========================================
echo   Build Complete!
echo ========================================
echo.

pause
