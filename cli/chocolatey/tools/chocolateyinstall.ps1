$ErrorActionPreference = 'Stop'

$packageName = 'lynxprompt'
$version = '0.3.0'

# Check if Node.js is installed
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    throw "Node.js is required but not installed. Please install Node.js first: choco install nodejs"
}

# Install via npm globally with specific version
# Note: npm writes informational messages (notices, funding) to stderr, which would
# cause PowerShell to throw with ErrorActionPreference=Stop. We capture all output
# and check the exit code manually instead.
Write-Host "Installing $packageName@$version via npm..."

$npmOutput = & npm install -g "lynxprompt@$version" 2>&1
$npmExitCode = $LASTEXITCODE

# Output the npm messages for visibility
$npmOutput | ForEach-Object { Write-Host $_ }

if ($npmExitCode -ne 0) {
    throw "npm install failed with exit code $npmExitCode"
}

Write-Host "$packageName $version installed successfully!" -ForegroundColor Green


