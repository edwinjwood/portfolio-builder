# Development Setup Guide

This guide will help you get the Hotboyz project running on your local machine.

## Prerequisites

Before running the setup script, make sure you have:

1. **Node.js** (v16 or higher)
   ```bash
   node --version
   ```

2. **PostgreSQL** (v12 or higher)
   - **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
   - **Mac**: `brew install postgresql`

3. **Git**
   ```bash
   git --version
   ```

## Quick Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/SCCapstone/Hotboyz.git
   cd Hotboyz
   ```

2. **Check out the dro branch**:
   ```bash
   git checkout dro
   ```

3. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

   The script will:
   - Check if PostgreSQL is installed and running
   - Create the database user and database
   - Install all npm dependencies
   - Create the `.env` file if needed
   - Run all database migrations

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## Troubleshooting

### PostgreSQL Issues

If you get permission errors with PostgreSQL:
```bash
sudo systemctl start postgresql
```

If the database user already exists but has wrong password:
```bash
sudo -u postgres psql -c "ALTER USER \"user\" WITH PASSWORD 'password';"
```

### Port Already in Use

If port 5001 or 5173 is already in use:
```bash
# Find and kill the process
lsof -ti:5001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Node Modules Issues

If you encounter module-related errors:
```bash
# Clean install
rm -rf backend/node_modules frontend/node_modules
rm backend/package-lock.json frontend/package-lock.json
./setup.sh
```

### Database Reset

If you need to completely reset the database:
```bash
sudo -u postgres psql -c "DROP DATABASE IF EXISTS faset_dev;"
sudo -u postgres createdb -O user faset_dev
node backend/scripts/apply_migrations.js
```

## Manual Setup (Alternative)

If the script doesn't work, follow these manual steps:

1. **Setup PostgreSQL**:
   ```bash
   sudo -u postgres psql
   CREATE USER "user" WITH PASSWORD 'password';
   ALTER USER "user" CREATEDB;
   CREATE DATABASE faset_dev OWNER user;
   \q
   ```

2. **Install dependencies**:
   ```bash
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

3. **Create backend/.env**:
   ```
   DATABASE_URL=postgres://user:password@localhost:5432/faset_dev
   JWT_SECRET=your-secret-jwt-key-change-this
   SKIP_STRIPE=true
   PORT=5001
   ```

4. **Run migrations**:
   ```bash
   node backend/scripts/apply_migrations.js
   ```

5. **Start the server**:
   ```bash
   npm run dev
   ```

## Need Help?

If you're still having issues, contact the team or create an issue in the repository.
