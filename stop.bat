@echo off
chcp 65001 >/dev/null
title CRM 项目停止

echo ========================================
echo   停止 CRM 项目
echo ========================================
echo.

echo 正在停止所有 Node.js 进程...
taskkill /F /IM node.exe 2>/dev/null

if %errorlevel% == 0 (
    echo 成功停止所有服务
) else (
    echo 没有运行中的服务
)

echo.
timeout /t 2 /nobreak >/dev/null
