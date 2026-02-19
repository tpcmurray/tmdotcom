# dev.ps1 - Idempotent local dev setup and start for terrymurray.com
# Usage: .\dev.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
Push-Location $root

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   $msg" -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "   $msg (skipped)" -ForegroundColor DarkGray }
function Write-Warn($msg) { Write-Host "   $msg" -ForegroundColor Yellow }

try {
    # -- 1. Check prerequisites
    Write-Step "Checking prerequisites"

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js is not installed. Install from https://nodejs.org"
    }
    $nodeVersion = node --version
    Write-Ok "Node.js $nodeVersion"

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed. Install from https://docker.com"
    }
    Write-Ok "Docker available"

    # -- 2. Install dependencies
    Write-Step "Installing dependencies"

    if (Test-Path "node_modules/.package-lock.json") {
        $pkgTime = (Get-Item "package.json").LastWriteTime
        $lockTime = (Get-Item "node_modules/.package-lock.json").LastWriteTime
        if ($pkgTime -gt $lockTime) {
            npm install
            Write-Ok "Dependencies updated"
        }
        else {
            Write-Skip "node_modules up to date"
        }
    }
    else {
        npm install
        Write-Ok "Dependencies installed"
    }

    # -- 3. Check .env.local
    Write-Step "Checking environment"

    if (-not (Test-Path ".env.local")) {
        throw ".env.local not found. Copy from the README template and fill in your values."
    }

    $envContent = Get-Content ".env.local" -Raw
    $placeholders = @("your-google-client-id", "your-google-client-secret", "your-email@gmail.com")
    $warnings = @()
    foreach ($ph in $placeholders) {
        if ($envContent -match [regex]::Escape($ph)) {
            $warnings += $ph
        }
    }
    if ($warnings.Count -gt 0) {
        Write-Warn "Placeholder values detected in .env.local:"
        foreach ($w in $warnings) { Write-Warn "  - $w" }
        Write-Warn "The app may not fully work until these are replaced."
    }
    else {
        Write-Ok ".env.local configured"
    }

    # -- 4. Start PostgreSQL via Docker
    Write-Step "Starting PostgreSQL (Docker)"

    $ErrorActionPreference = "Continue"
    $containerStatus = docker inspect -f "{{.State.Running}}" terrymurray-db 2>&1
    $ErrorActionPreference = "Stop"

    if ("$containerStatus" -eq "true") {
        Write-Skip "terrymurray-db already running"
    }
    else {
        docker compose up -d db
        Write-Ok "terrymurray-db started"

        # Wait for PostgreSQL to accept connections
        Write-Host "   Waiting for PostgreSQL to be ready..." -ForegroundColor White
        $ready = $false
        for ($i = 0; $i -lt 30; $i++) {
            $ErrorActionPreference = "Continue"
            $null = docker exec terrymurray-db pg_isready -U tmdotcom 2>&1
            $ErrorActionPreference = "Stop"
            if ($LASTEXITCODE -eq 0) {
                $ready = $true
                break
            }
            Start-Sleep -Seconds 1
        }
        if ($ready) {
            Write-Ok "PostgreSQL is ready"
        }
        else {
            throw "PostgreSQL did not become ready within 30 seconds"
        }
    }

    # -- 5. Generate Prisma client + run migrations
    Write-Step "Running Prisma migrations"

    $ErrorActionPreference = "Continue"

    $null = npx prisma generate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Prisma client generated"
    }
    else {
        Write-Warn "Prisma generate failed - check DATABASE_URL in .env.local"
    }

    npx prisma migrate deploy 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Migrations applied"
    }
    else {
        Write-Warn "Migration failed - is DATABASE_URL correct in .env.local?"
    }

    $ErrorActionPreference = "Stop"

    # -- 6. Ensure uploads directory exists
    Write-Step "Checking uploads directory"

    if (-not (Test-Path "uploads/images")) {
        New-Item -ItemType Directory -Path "uploads/images" -Force | Out-Null
        Write-Ok "Created uploads/images/"
    }
    else {
        Write-Skip "uploads/images/ exists"
    }

    # -- 7. Start dev server
    Write-Step "Starting dev server"
    Write-Host "   http://localhost:3000`n" -ForegroundColor White

    npm run dev
}
catch {
    Write-Host "`nERROR: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
