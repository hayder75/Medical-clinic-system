#!/bin/bash

# Medical Clinic System - Automated Deployment Script
# This script automatically pulls, builds, and deploys the application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "Medical Clinic System - Auto Deployment"
echo "==========================================${NC}"
echo ""

# Navigate to project directory
PROJECT_DIR=""
if [ -d "$HOME/medical-clinic-system" ]; then
    PROJECT_DIR="$HOME/medical-clinic-system"
elif [ -d "/home/ubuntu/medical-clinic-system" ]; then
    PROJECT_DIR="/home/ubuntu/medical-clinic-system"
elif [ -d "medical-clinic-system" ]; then
    PROJECT_DIR="medical-clinic-system"
else
    echo -e "${RED}Error: Could not find medical-clinic-system directory${NC}"
    echo "Please run this script from the project directory or set PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✓ Project directory: $PROJECT_DIR${NC}"
echo ""

# Pull latest changes
echo -e "${YELLOW}[1/6] Pulling latest changes from GitHub...${NC}"
git pull origin main || {
    echo -e "${RED}Error: Failed to pull from GitHub${NC}"
    exit 1
}
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Backend setup
echo -e "${YELLOW}[2/6] Setting up backend...${NC}"
cd backend

# Install backend dependencies (only if package.json changed or node_modules missing)
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "${YELLOW}Installing/updating backend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies up to date${NC}"
fi

# Verify .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: backend/.env file not found!${NC}"
    echo -e "${YELLOW}Please ensure DATABASE_URL and JWT_SECRET are configured${NC}"
fi

cd ..
echo ""

# Frontend setup
echo -e "${YELLOW}[3/6] Setting up frontend...${NC}"
cd frontend

# Install frontend dependencies (only if package.json changed or node_modules missing)
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "${YELLOW}Installing/updating frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies up to date${NC}"
fi

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build || {
    echo -e "${RED}Error: Frontend build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Frontend built successfully${NC}"

cd ..
echo ""

# Stop PM2 processes
echo -e "${YELLOW}[4/6] Stopping PM2 processes...${NC}"
pm2 stop all 2>/dev/null || true
sleep 1
pm2 delete all 2>/dev/null || true
echo -e "${GREEN}✓ PM2 processes stopped and removed${NC}"
echo ""

# Start backend
echo -e "${YELLOW}[5/6] Starting backend...${NC}"
cd backend
pm2 start server.js --name medical-clinic-backend
echo -e "${GREEN}✓ Backend started${NC}"

# Start frontend server (if using separate server)
echo -e "${YELLOW}Starting frontend server...${NC}"
cd ../frontend
if [ -f "server-frontend.js" ]; then
    pm2 start server-frontend.js --name medical-clinic-frontend
    echo -e "${GREEN}✓ Frontend server started${NC}"
else
    echo -e "${YELLOW}Note: server-frontend.js not found, frontend served by backend${NC}"
fi

# Save PM2 configuration
pm2 save
echo -e "${GREEN}✓ PM2 configuration saved${NC}"
echo ""

# Wait for services to start
echo -e "${YELLOW}[6/6] Waiting for services to start...${NC}"
sleep 5

# Check PM2 status
echo -e "${BLUE}=========================================="
echo "PM2 Status:"
echo "==========================================${NC}"
pm2 list
echo ""

# Health check
echo -e "${YELLOW}Checking backend health...${NC}"
sleep 2
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "ERROR")

if echo "$HEALTH_CHECK" | grep -q "OK\|connected"; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
    echo "$HEALTH_CHECK" | head -c 300
    echo ""
else
    echo -e "${YELLOW}⚠ Backend health check inconclusive${NC}"
    echo -e "${YELLOW}Check PM2 logs: pm2 logs medical-clinic-backend${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  View logs:        pm2 logs"
echo "  View status:      pm2 list"
echo "  Restart all:      pm2 restart all"
echo "  Stop all:         pm2 stop all"
echo "  Backend health:   curl http://localhost:3000/api/health"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the application in your browser"
echo "  2. Clear browser cache if needed (Ctrl+Shift+R)"
echo "  3. Check PM2 logs if you encounter any issues"
echo ""
