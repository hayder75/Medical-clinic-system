#!/bin/bash
# Deployment script for server
# This script pulls latest changes, checks for migrations, and restarts services

set -e  # Exit on error

echo "=========================================="
echo "Starting deployment to server"
echo "=========================================="
echo ""

# Navigate to project directory
cd ~/medical-clinic-system || cd ~/Medical-clinic-system || { echo "Error: Project directory not found"; exit 1; }

echo "Step 1: Pulling latest changes from GitHub..."
git pull origin master
if [ $? -ne 0 ]; then
    echo "Error: Failed to pull from GitHub"
    exit 1
fi
echo "✓ Successfully pulled latest changes"
echo ""

echo "Step 2: Installing/updating dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install backend dependencies"
    exit 1
fi
echo "✓ Backend dependencies installed"
echo ""

cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install frontend dependencies"
    exit 1
fi
echo "✓ Frontend dependencies installed"
echo ""

cd ../backend

echo "Step 3: Checking Prisma migrations..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "Error: Failed to generate Prisma client"
    exit 1
fi
echo "✓ Prisma client generated"
echo ""

echo "Step 4: Applying database migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo "Warning: Migration deploy failed, trying db push..."
    npx prisma db push --accept-data-loss
    if [ $? -ne 0 ]; then
        echo "Error: Failed to apply database migrations"
        exit 1
    fi
fi
echo "✓ Database migrations applied"
echo ""

echo "Step 5: Restarting PM2 processes..."
pm2 restart all
if [ $? -ne 0 ]; then
    echo "Error: Failed to restart PM2 processes"
    exit 1
fi
echo "✓ PM2 processes restarted"
echo ""

echo "Step 6: Checking PM2 status..."
pm2 status
echo ""

echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check PM2 logs: pm2 logs"
echo "2. Check backend logs: pm2 logs backend"
echo "3. Check frontend logs: pm2 logs frontend"
echo "4. Monitor for errors: pm2 monit"
echo ""
