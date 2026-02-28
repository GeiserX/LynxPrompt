$ErrorActionPreference = 'Stop'

$packageName = 'lynxprompt'
$version = '0.4.4'

# Refresh environment variables so node/npm are in PATH after nodejs dependency install
Update-SessionEnvironment

# Check if Node.js is installed
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    throw "Node.js is required but not installed. Please install Node.js first: choco install nodejs"
}

# npm.ps1 (Node's PowerShell wrapper) propagates stderr as terminating errors
# under ErrorActionPreference=Stop, even with 2>&1. Lower it for the npm call
# and check the exit code manually.
Write-Host "Installing $packageName@$version via npm..."

$prevEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$npmOutput = & npm install -g "lynxprompt@$version" 2>&1
$npmExitCode = $LASTEXITCODE
$ErrorActionPreference = $prevEAP

$npmOutput | ForEach-Object { Write-Host $_ }

if ($npmExitCode -ne 0) {
    throw "npm install failed with exit code $npmExitCode"
}

Write-Host "$packageName $version installed successfully!" -ForegroundColor Green


