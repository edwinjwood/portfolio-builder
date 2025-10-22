# Setup script for Hotboyz project (Windows)
# Run this with: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Hotboyz Project Setup (Windows)" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install it from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is installed
$pgPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $pgPath) {
    Write-Host "❌ PostgreSQL is not installed. Please install it from https://www.postgresql.org/download/windows/" -ForegroundColor Red
    Write-Host "   After installation, add PostgreSQL bin directory to your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ PostgreSQL is installed" -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL service is running
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne "Running") {
    Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service $pgService.Name
}

# Setup database user and database
Write-Host "Setting up database..." -ForegroundColor Cyan
$env:PGPASSWORD = "postgres"

# Create user
psql -U postgres -c "CREATE USER \`"user\`" WITH PASSWORD 'password';" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  User may already exist, updating password..." -ForegroundColor Yellow
}
psql -U postgres -c "ALTER USER \`"user\`" WITH PASSWORD 'password';" 2>$null
psql -U postgres -c "ALTER USER \`"user\`" CREATEDB;" 2>$null

# Create database
psql -U postgres -c "DROP DATABASE IF EXISTS faset_dev;" 2>$null
psql -U postgres -c "CREATE DATABASE faset_dev OWNER \`"user\`";" 2>$null

Write-Host "✓ Database configured" -ForegroundColor Green
Write-Host ""

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "Creating backend/.env..." -ForegroundColor Yellow
    @"
# Database Configuration
DATABASE_URL=postgres://user:password@localhost:5432/faset_dev

# JWT Secret (change this to a secure random string)
JWT_SECRET=your-secret-jwt-key-change-this

# Stripe Configuration (optional for basic testing)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Skip Stripe for local development
SKIP_STRIPE=true

# Port Configuration
PORT=5001
"@ | Out-File -FilePath "backend\.env" -Encoding utf8
    Write-Host "✓ Created backend/.env" -ForegroundColor Green
} else {
    Write-Host "✓ backend/.env already exists" -ForegroundColor Green
}
Write-Host ""

# Run database migrations
Write-Host "Running database migrations..." -ForegroundColor Cyan
node backend/scripts/apply_migrations.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database migrations completed" -ForegroundColor Green
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "The app will be available at:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5001" -ForegroundColor White
Write-Host ""
