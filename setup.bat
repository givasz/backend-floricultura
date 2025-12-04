@echo off
echo ========================================
echo  Backend API - Setup Automatico
echo ========================================
echo.

echo [1/3] Verificando PostgreSQL...
docker ps | findstr postgres-backend >nul 2>&1
if %errorlevel% equ 0 (
    echo PostgreSQL ja esta rodando!
) else (
    echo Iniciando PostgreSQL no Docker...
    docker run --name postgres-backend -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=backend_db -p 5432:5432 -d postgres:15
    echo Aguardando PostgreSQL iniciar...
    timeout /t 5 /nobreak >nul
)
echo.

echo [2/3] Executando migracoes do Prisma...
call npx prisma migrate dev --name init
echo.

echo [3/3] Iniciando servidor...
echo.
echo ========================================
echo  Servidor rodando em http://localhost:3000
echo  Health check: http://localhost:3000/health
echo ========================================
echo.
call npm run dev
