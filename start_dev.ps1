param(
    [switch]$NoExit = $false
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Starting PhantomShield Dev Environment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = $PSScriptRoot

# 1. Start the FastAPI Backend in a new window
Write-Host "=> Launching Backend (FastAPI on Port 8000)..." -ForegroundColor Green
$backendCmd = "cd '$baseDir'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit -Command & { $backendCmd }"

# 2. Start the Vite Frontend in a new window
Write-Host "=> Launching Frontend (Vite on Port 5173)..." -ForegroundColor Green
$frontendCmd = "cd '$baseDir\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit -Command & { $frontendCmd }"

Write-Host ""
Write-Host "Done! Two new PowerShell windows should have opened." -ForegroundColor Yellow
Write-Host " - One running your Python Backend" -ForegroundColor Gray
Write-Host " - One running your React/Vite Frontend" -ForegroundColor Gray
Write-Host "Close those windows when you want to stop the servers." -ForegroundColor Gray
Write-Host ""
