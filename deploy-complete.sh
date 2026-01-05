#!/bin/bash

# Complete Medical Clinic System Deployment Script
# This script does EVERYTHING: pull, install, build, restart

set -e  # Exit on error

echo "=========================================="
echo "Medical Clinic System - COMPLETE Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project directory
cd ~/medical-clinic-system 2>/dev/null || cd /home/ubuntu/medical-clinic-system || {
    echo -e "${RED}Error: Could not find medical-clinic-system directory${NC}"
    exit 1
}

echo -e "${GREEN}✓ Found project directory: $(pwd)${NC}"
echo ""

# Pull latest changes
echo -e "${YELLOW}[1/7] Pulling latest code from GitHub...${NC}"
git pull origin main || {
    echo -e "${RED}Error: Failed to pull from GitHub${NC}"
    exit 1
}
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Backend setup
echo -e "${YELLOW}[2/7] Setting up backend...${NC}"
cd backend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Backend dependencies exist${NC}"
fi

# Check .env
if [ ! -f ".env" ]; then
    echo -e "${RED}Warning: backend/.env file not found!${NC}"
    echo -e "${YELLOW}The server should have its own .env file${NC}"
fi

cd ..
echo ""

# Frontend setup
echo -e "${YELLOW}[3/7] Setting up frontend...${NC}"
cd frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Frontend dependencies exist${NC}"
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

# Stop all PM2 processes
echo -e "${YELLOW}[4/7] Stopping all PM2 processes...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ PM2 processes stopped${NC}"
echo ""

# Start backend
echo -e "${YELLOW}[5/7] Starting backend...${NC}"
cd backend
pm2 start server.js --name medical-clinic-backend || {
    echo -e "${RED}Error: Failed to start backend${NC}"
    exit 1
}
echo -e "${GREEN}✓ Backend started${NC}"
cd ..
echo ""

# Start frontend server
echo -e "${YELLOW}[6/7] Starting frontend server...${NC}"
cd frontend
if [ -f "server-frontend.js" ]; then
    pm2 start server-frontend.js --name medical-clinic-frontend || {
        echo -e "${RED}Error: Failed to start frontend server${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Frontend server started${NC}"
else
    echo -e "${RED}Error: server-frontend.js not found!${NC}"
    exit 1
fi
cd ..
echo ""

# Save PM2 configuration
echo -e "${YELLOW}[7/7] Saving PM2 configuration...${NC}"
pm2 save
echo -e "${GREEN}✓ PM2 configuration saved${NC}"
echo ""

# Wait for services to start
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 5

# Check PM2 status
echo ""
echo -e "${YELLOW}=========================================="
echo "PM2 Status:"
echo "==========================================${NC}"
pm2 list

# Health checks
echo ""
echo -e "${YELLOW}=========================================="
echo "Health Checks:"
echo "==========================================${NC}"

# Backend health check
echo -e "${YELLOW}Checking backend...${NC}"
sleep 2
BACKEND_HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "ERROR")
if [[ "$BACKEND_HEALTH" == *"OK"* ]] || [[ "$BACKEND_HEALTH" == *"connected"* ]] || [[ "$BACKEND_HEALTH" == *"status"* ]]; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo -e "${YELLOW}Check logs: pm2 logs medical-clinic-backend${NC}"
fi

# Frontend health check
echo -e "${YELLOW}Checking frontend...${NC}"
sleep 1
FRONTEND_HEALTH=$(curl -s http://localhost:3001 2>/dev/null | head -c 100 || echo "ERROR")
if [[ "$FRONTEND_HEALTH" != "ERROR" ]] && [[ "$FRONTEND_HEALTH" == *"html"* ]] || [[ "$FRONTEND_HEALTH" == *"<!doctype"* ]] || [[ "$FRONTEND_HEALTH" == *"<html"* ]]; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
    echo -e "${YELLOW}Check logs: pm2 logs medical-clinic-frontend${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check PM2 logs: pm2 logs"
echo "2. Check backend: curl http://localhost:3000/api/health"
echo "3. Check frontend: curl http://localhost:3001"
echo "4. Test in browser: http://51.222.143.50"
echo "5. Clear browser cache if needed"
echo ""

