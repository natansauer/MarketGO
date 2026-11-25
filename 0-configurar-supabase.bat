@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo  MarketGo - configurar o banco no Supabase
echo ============================================================
echo.
echo 1) O script completo (tabelas, RLS, funcoes e as 6 lojas / 50 produtos)
echo    vai para a area de transferencia agora.
powershell -NoProfile -Command "Get-Content -Raw -Encoding UTF8 'supabase\setup-completo.sql' | Set-Clipboard"
if errorlevel 1 (
  echo    Nao consegui copiar. Abra supabase\setup-completo.sql, Ctrl+A, Ctrl+C.
) else (
  echo    Copiado!
)
echo.
echo 2) Vou abrir o SQL Editor do seu projeto. Cole com Ctrl+V e clique em Run.
echo    Deve terminar com "Success. No rows returned".
start "" "https://supabase.com/dashboard/project/lckricwkvfukvoqvyyvt/sql/new"
echo.
echo 3) Depois, desligue a confirmacao de e-mail (secao 3.4 do guia):
echo    Authentication - Sign In / Providers - Email - desligar "Confirm email" - Save.
pause
start "" "https://supabase.com/dashboard/project/lckricwkvfukvoqvyyvt/auth/providers"
echo.
echo Conferencia (Table Editor): stores = 6 linhas, products = 50 linhas.
echo Rode este script so UMA vez. Se aparecer "already exists", o banco ja esta pronto.
echo.
pause
