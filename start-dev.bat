@echo off
echo ========================================================
echo   Launching SubscriptIQ - Brightloop Software Platform
echo ========================================================
echo Starting Backend API Server (Port 5000)...
start "SubscriptIQ Backend" cmd /k "cd backend && npm start"

timeout /t 2 >nul

echo Starting Frontend Dev Server (Port 3000)...
start "SubscriptIQ Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application will be available at: http://localhost:3000
echo Backend API available at: http://localhost:5000/api/health
echo ========================================================
pause

