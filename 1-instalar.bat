@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo  MarketGo - instalar dependencias (Expo SDK 58)
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale o Node 22 LTS ou 24 LTS em https://nodejs.org
  pause
  exit /b 1
)
for /f %%v in ('node -v') do set NODEV=%%v
echo Node %NODEV%
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit((a===22&&b>=13)||(a===24&&b>=3)||a>=26?0:1)"
if errorlevel 1 (
  echo.
  echo ATENCAO: o Expo SDK 58 pede Node 22.13+, 24.3+ ou 26+ ^(versoes impares nao^).
  echo Atualize em https://nodejs.org e rode este arquivo de novo.
  pause
  exit /b 1
)
echo.
echo [1/3] npm install ...
call npm install
if errorlevel 1 (
  echo.
  echo npm install falhou. Tentando de novo com --legacy-peer-deps ...
  call npm install --legacy-peer-deps
  if errorlevel 1 (
    echo Falha na instalacao. Copie a mensagem de erro acima e mande para a IA.
    pause
    exit /b 1
  )
)
echo.
echo [2/3] Alinhando as versoes com o SDK 58 (npx expo install --fix) ...
call npx expo install --fix
echo.
echo [3/3] Conferindo o .env ...
if not exist .env (
  copy .env.example .env >nul
  echo .env criado a partir do .env.example. Preencha a URL e a chave.
  notepad .env
) else (
  echo .env encontrado.
)
echo.
echo Pronto! Proximos passos:
echo   0-configurar-supabase.bat  (so na primeira vez)
echo   2-iniciar.bat              (abre o QR Code para o Expo Go)
pause
