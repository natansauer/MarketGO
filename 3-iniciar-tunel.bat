@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo MarketGo - iniciando o Expo em modo tunel (para redes que bloqueiam o celular)
echo Na primeira vez o Expo pode pedir para instalar o @expo/ngrok: responda Y.
echo.
call npx expo start -c --tunnel
pause
