$ErrorActionPreference = 'Stop'

$packageName = 'lynxprompt'

$prevEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$npmOutput = & npm uninstall -g lynxprompt 2>&1
$npmExitCode = $LASTEXITCODE
$ErrorActionPreference = $prevEAP

$npmOutput | ForEach-Object { Write-Host $_ }

if ($npmExitCode -ne 0) {
    throw "npm uninstall failed with exit code $npmExitCode"
}

Write-Host "$packageName uninstalled successfully!" -ForegroundColor Green
