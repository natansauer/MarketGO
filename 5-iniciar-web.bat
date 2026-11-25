@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo MarketGo - abrindo no navegador (bom para testar uma segunda conta, cenario 17)
echo.
call npx expo start -c --web
pause
