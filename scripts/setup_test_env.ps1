Param(
    [string]$VenvPath = "venv"
)

$ErrorActionPreference = "Stop"

Write-Host "Creating virtual environment at '$VenvPath'..."
py -3 -m venv $VenvPath

$pythonExe = Join-Path $VenvPath "Scripts\python.exe"

Write-Host "Upgrading pip..."
& $pythonExe -m pip install --upgrade pip

Write-Host "Installing test dependencies from requirements-test.txt..."
& $pythonExe -m pip install -r requirements-test.txt

Write-Host "Test environment is ready."
Write-Host "Run tests with:"
Write-Host "  $pythonExe -m pytest app\tests\test_phase7_decoy_integration.py -q"
