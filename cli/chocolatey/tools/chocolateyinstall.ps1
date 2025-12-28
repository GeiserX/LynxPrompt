$ErrorActionPreference = 'Stop'

$packageName = 'lynxprompt'
$version = '0.1.0'

# Check if Node.js is installed
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    throw "Node.js is required but not installed. Please install Node.js first: choco install nodejs"
}

# Install via npm globally with specific version
Write-Host "Installing $packageName@$version via npm..."
npm install -g "lynxprompt@$version"

Write-Host "$packageName $version installed successfully!" -ForegroundColor Green


