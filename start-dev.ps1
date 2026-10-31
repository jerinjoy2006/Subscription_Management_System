Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching SubscriptIQ - Brightloop Software Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Application is opening at: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API is live at: http://localhost:5000/api/health" -ForegroundColor Green

