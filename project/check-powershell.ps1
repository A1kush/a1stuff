<#
  Simple PowerShell runtime check:
  - prints PowerShell version
  - shows execution policy list
  - runs a minimal command to verify execution
  - exits 0 on success, 1 on failure
#>

$success = $true

try {
    Write-Host "=== PowerShell runtime check ===`n"
    $pwCmd = Get-Command -Name pwsh -ErrorAction SilentlyContinue
    if (-not $pwCmd) { $pwCmd = Get-Command -Name powershell -ErrorAction SilentlyContinue }
    Write-Host "PowerShell executable path:" ($pwCmd | Select-Object -First 1 -ExpandProperty Source)
} catch {
    Write-Warning "Could not locate PowerShell executable: $_"
    $success = $false
}

try {
    Write-Host "PowerShell version:" $PSVersionTable.PSVersion
} catch {
    Write-Warning "Could not read PSVersion: $_"
    $success = $false
}

try {
    Write-Host "`nExecution policy (list):"
    Get-ExecutionPolicy -List | Format-Table -AutoSize
} catch {
    Write-Warning "Could not read execution policy: $_"
    $success = $false
}

try {
    Write-Host "`nRunning a sample command: Get-Process -Id $PID"
    Get-Process -Id $PID | Select-Object -Property Id,ProcessName,Handles,CPU
} catch {
    Write-Warning "Sample command failed: $_"
    $success = $false
}

try {
    Write-Host "`nWriting a test output:"
    Write-Output "Hello from check-powershell.ps1"
} catch {
    Write-Warning "Could not write output: $_"
    $success = $false
}

if ($success) {
    Write-Host "`nResult: PowerShell runtime appears to work (exit 0)."
    exit 0
} else {
    Write-Error "`nResult: One or more checks failed (exit 1)."
    exit 1
}
