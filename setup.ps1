<#!
.SYNOPSIS
  A1K Runner Game - Windows PowerShell Environment Setup Script
.DESCRIPTION
  Mirrors functionality of ./setup (Bash) to prepare Node.js, Playwright, and Python tooling.
  Safe to re-run; idempotent installs. Adds optional skipping of tests/assets.
.PARAMETER SkipTests
  Skip running Playwright test suite.
.PARAMETER SkipAssets
  Skip generating flipbook assets.
.PARAMETER Python
  Python executable to use (default 'python').
.EXAMPLE
  ./setup.ps1 -SkipTests
.EXAMPLE
  pwsh -File setup.ps1 -Python python3
#>

[CmdletBinding()] param(
    [switch]$SkipTests,
    [switch]$SkipAssets,
    [string]$Python = 'python'
)

$ErrorActionPreference = 'Stop'

function Write-Section($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Step($msg)    { Write-Host "[*] $msg" -ForegroundColor Yellow }
function Write-OK($msg)      { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg)   { Write-Host "[WARN] $msg" -ForegroundColor DarkYellow }
function Write-Fail($msg)    { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Host "🎮 Setting up A1K Runner Game Development Environment..." -ForegroundColor Magenta

# 0. Validate location
if (-not (Test-Path 'giftbox auto.html')) { Write-Fail "Not in repo root (giftbox auto.html missing)"; exit 1 }

$RepoRoot = Get-Location
$NodeDir  = Join-Path $RepoRoot 'a1 a1'
$VenvPath = Join-Path $RepoRoot '.venv'
$ToolsDir = Join-Path $NodeDir 'tools'
if (-not (Test-Path $NodeDir)) { Write-Fail "Directory 'a1 a1' missing"; exit 1 }

Write-Section 'Node.js Environment'
Set-Location $NodeDir
if (-not (Test-Path package.json)) { Write-Fail 'package.json missing in a1 a1'; exit 1 }

Write-Step 'Installing npm dependencies (npm install)'
try { npm install | Out-Null; Write-OK 'npm dependencies installed' } catch { Write-Fail "npm install failed: $_"; exit 1 }

Write-Step 'Installing Playwright browsers'
try { npx playwright install | Out-Null; Write-OK 'Playwright browsers installed' } catch { Write-Warn2 "Playwright install had issues: $_" }

Write-Section 'Python Virtual Environment'
if (-not (Test-Path $VenvPath)) {
    Write-Step 'Creating virtual environment (.venv)'
    & $Python -m venv $VenvPath
    Write-OK 'Virtual environment created'
} else { Write-Step 'Virtual environment already exists (.venv)' }

# Activate venv
$Activate = Join-Path $VenvPath 'Scripts' 'Activate.ps1'
if (-not (Test-Path $Activate)) { Write-Fail 'Activate script missing (venv not created properly)'; exit 1 }
. $Activate

Write-Step 'Upgrading pip'
& $Python -m pip install --upgrade pip | Out-Null

# Install Python requirements
if (Test-Path (Join-Path $NodeDir 'requirements.txt')) {
    Write-Step 'Installing core Python dependencies'
    pip install -r requirements.txt | Out-Null
    Write-OK 'Core Python deps installed'
}
if (Test-Path (Join-Path $NodeDir 'requirements-dev.txt')) {
    Write-Step 'Installing development Python dependencies'
    pip install -r requirements-dev.txt | Out-Null
    Write-OK 'Dev Python deps installed'
}

Write-Section 'Verification'
Write-Step 'Checking Python libraries'
foreach ($lib in 'PIL','imageio') {
    try { & $Python - <<"PY"
import $lib
print('$lib OK')
PY
    } catch { Write-Warn2 "$lib import failed" }
}

Write-Step 'Checking dev tooling versions'
foreach ($tool in 'ruff','black','mypy') {
    try { & $tool --version | Select-Object -First 1 } catch { Write-Warn2 "$tool not found (maybe not installed yet)" }
}

if (-not $SkipTests) {
    Write-Step 'Running Playwright test suite (non-fatal)'
    try { npm test } catch { Write-Warn2 'Playwright tests experienced errors' }
} else { Write-Step 'Skipping tests (--SkipTests supplied)' }

Write-Section 'Asset Generation'
if (-not $SkipAssets -and (Test-Path (Join-Path $ToolsDir 'generate_flipbooks.py'))) {
    Write-Step 'Generating flipbook assets'
    Push-Location $ToolsDir
    try { & $Python generate_flipbooks.py } catch { Write-Warn2 'Asset generation had issues' }
    Pop-Location
} else { Write-Step 'Skipping asset generation (missing script or --SkipAssets specified)' }

Set-Location $RepoRoot

Write-Section 'Summary'
Write-OK 'Node.js dependencies installed'
Write-OK 'Playwright browsers installed (or attempted)'
Write-OK 'Python virtual environment ready (.venv)'
Write-OK 'Python dependencies installed'
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host '  Activate environment (new session):  .\.venv\Scripts\Activate.ps1'
Write-Host '  Run tests:                           cd "a1 a1"; npm test'
Write-Host '  Generate assets later:               cd "a1 a1\tools"; python generate_flipbooks.py'
Write-Host '  Edit game file:                      giftbox auto.html'

Write-Host "\n🎉 Setup complete!" -ForegroundColor Magenta