#!/bin/bash

# Setup script for Hotboyz project
# Run this after cloning and checking out the dro branch

set -e  # Exit on any error

echo "================================"
echo "Hotboyz Project Setup"
echo "================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   Mac: brew install postgresql"
    exit 1
fi

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql 2>/dev/null && ! pgrep -x postgres >/dev/null; then
    echo "❌ PostgreSQL is not running. Starting it..."
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    else
        echo "Please start PostgreSQL manually"
        exit 1
    fi
fi

echo "✓ PostgreSQL is running"
echo ""

# Setup database user
echo "Setting up database user..."
sudo -u postgres psql -c "CREATE USER \"user\" WITH PASSWORD 'password';" 2>/dev/null || echo "  User already exists"
sudo -u postgres psql -c "ALTER USER \"user\" WITH PASSWORD 'password';" 2>/dev/null
sudo -u postgres psql -c "ALTER USER \"user\" CREATEDB;" 2>/dev/null
echo "✓ Database user configured"
echo ""

# Create database
echo "Creating database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS faset_dev;" 2>/dev/null || true
sudo -u postgres createdb -O user faset_dev 2>/dev/null || echo "  Database already exists"
echo "✓ Database created"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..
echo "✓ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "✓ Frontend dependencies installed"
echo ""

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env not found. Creating from template..."
    cat > backend/.env << 'EOF'
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
EOF
    echo "✓ Created backend/.env"
else
    echo "✓ backend/.env already exists"
fi
echo ""

# Run database migrations
echo "Running database migrations..."
node backend/scripts/apply_migrations.js
echo "✓ Database migrations completed"
echo ""

echo "================================"
echo "✓ Setup Complete!"
echo "================================"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "The app will be available at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5001"
echo ""
