@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo MarketGo - iniciando o Expo (cache limpo, le o .env de novo)
echo Leia o QR Code com o Expo Go (SDK 58). Para parar: Ctrl+C
echo Se o celular nao conectar, use o 3-iniciar-tunel.bat
echo.
call npx expo start -c
pause
