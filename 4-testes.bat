@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo  MarketGo - verificacoes automaticas (Etapa 14.1)
echo ============================================================
set FALHOU=0
echo.
echo [1/3] Tipos (npm run typecheck)
call npm run typecheck
if errorlevel 1 set FALHOU=1
echo.
echo [2/3] Testes do app - Jest (46 testes)
call npm run test:app
if errorlevel 1 set FALHOU=1
echo.
echo [3/3] Testes do banco - PGlite (16 testes)
call npm run test:db
if errorlevel 1 set FALHOU=1
echo.
if "%FALHOU%"=="1" (
  echo ALGUMA VERIFICACAO FALHOU. Copie a saida acima e mande para a IA.
) else (
  echo Tudo certo: tipos sem erros, 46 testes do app e 16 do banco passando.
)
pause
