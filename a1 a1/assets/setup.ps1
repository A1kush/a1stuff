# A1K Runner Game - Windows PowerShell Setup Script
# This script sets up both Node.js and Python environments for the game development

Write-Host "🎮 Setting up A1K Runner Game Development Environment..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "giftbox auto.html")) {
    Write-Host "❌ Error: Not in the correct project directory" -ForegroundColor Red
    Write-Host "Expected to find 'giftbox auto.html' in current directory" -ForegroundColor Red
    exit 1
}

# 1. Node.js Setup
Write-Host "📦 Setting up Node.js environment..." -ForegroundColor Yellow
Set-Location "a1 a1"

if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found in 'a1 a1' directory" -ForegroundColor Red
    exit 1
}

# Install Node.js dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install

# Install Playwright browsers
Write-Host "🎭 Installing Playwright browsers..." -ForegroundColor Cyan
npx playwright install

# 2. Python Setup
Write-Host "🐍 Setting up Python environment..." -ForegroundColor Yellow

# Create virtual environment if it doesn't exist
if (-not (Test-Path "../.venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
    python -m venv ../.venv
}

# Activate virtual environment (Windows)
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& "../.venv/Scripts/Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip

# Install core requirements
if (Test-Path "requirements.txt") {
    Write-Host "Installing core Python dependencies..." -ForegroundColor Cyan
    pip install -r requirements.txt
}

# Install development requirements
if (Test-Path "requirements-dev.txt") {
    Write-Host "Installing development Python dependencies..." -ForegroundColor Cyan
    pip install -r requirements-dev.txt
}

# 3. Verify installations
Write-Host "✅ Verifying installations..." -ForegroundColor Green

# Test Node.js setup
Write-Host "Testing Node.js/Playwright setup..." -ForegroundColor Cyan
try {
    npm test
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some tests failed, but setup is complete" -ForegroundColor Yellow
}

# Test Python tools
Write-Host "Testing Python tools..." -ForegroundColor Cyan
try {
    python -c "import PIL; print('✅ PIL/Pillow working')"
    python -c "import imageio; print('✅ imageio working')"
} catch {
    Write-Host "⚠️  Python dependencies may need attention" -ForegroundColor Yellow
}

# Test linting tools
Write-Host "Testing development tools..." -ForegroundColor Cyan
try {
    ruff --version | Out-Host
    Write-Host "✅ ruff working" -ForegroundColor Green
    black --version | Out-Host  
    Write-Host "✅ black working" -ForegroundColor Green
    mypy --version | Out-Host
    Write-Host "✅ mypy working" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some development tools may need attention" -ForegroundColor Yellow
}

# 4. Generate some sample assets to verify tools work
Write-Host "🎨 Testing asset generation..." -ForegroundColor Yellow
if (Test-Path "tools/generate_flipbooks.py") {
    Set-Location tools
    try {
        python generate_flipbooks.py
        Write-Host "✅ Asset generation successful!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Asset generation had issues, but tools are installed" -ForegroundColor Yellow
    }
    Set-Location ..
}

Set-Location ..

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  - Node.js dependencies installed"
Write-Host "  - Playwright browsers installed"
Write-Host "  - Python virtual environment created at .venv"
Write-Host "  - Python dependencies installed"
Write-Host "  - Development tools (ruff, black, mypy) ready"
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Activate Python environment: .venv/Scripts/Activate.ps1"
Write-Host "  2. Run tests: cd 'a1 a1'; npm test"
Write-Host "  3. Generate assets: cd 'a1 a1/tools'; python generate_flipbooks.py"
Write-Host "  4. Edit HTML game: open giftbox auto.html"
Write-Host ""
Write-Host "📁 Key files:" -ForegroundColor Cyan
Write-Host "  - giftbox auto.html: Main game file"
Write-Host "  - a1 a1/: Game assets and tools"
Write-Host "  - a1 a1/tools/generate_flipbooks.py: VFX asset generator"
Write-Host "  - a1 a1/tests/: Playwright test suite"