#!/bin/bash

# Medical Clinic System Deployment Script
# Run this script on the server: ssh ubuntu@51.222.143.50

set -e  # Exit on error

echo "=========================================="
echo "Medical Clinic System Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project directory
cd ~/medical-clinic-system || cd /home/ubuntu/medical-clinic-system || {
    echo -e "${RED}Error: Could not find medical-clinic-system directory${NC}"
    exit 1
}

echo -e "${GREEN}✓ Found project directory${NC}"

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

# Backend setup
echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

# Verify .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Warning: backend/.env file not found!${NC}"
    echo -e "${YELLOW}Please create backend/.env with DATABASE_URL and JWT_SECRET${NC}"
fi

cd ..

# Frontend setup
echo -e "${YELLOW}Setting up frontend...${NC}"
cd frontend

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"

cd ..

# Stop PM2 processes
echo -e "${YELLOW}Stopping PM2 processes...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo -e "${GREEN}✓ PM2 processes stopped${NC}"

# Start backend
echo -e "${YELLOW}Starting backend...${NC}"
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
    echo -e "${YELLOW}Note: server-frontend.js not found, frontend may be served by backend${NC}"
fi

# Save PM2 configuration
pm2 save
echo -e "${GREEN}✓ PM2 configuration saved${NC}"

# Wait a moment for services to start
sleep 3

# Check PM2 status
echo -e "\n${YELLOW}PM2 Status:${NC}"
pm2 list

# Health check
echo -e "\n${YELLOW}Checking backend health...${NC}"
sleep 2
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "ERROR")

if [[ "$HEALTH_CHECK" == *"OK"* ]] || [[ "$HEALTH_CHECK" == *"connected"* ]]; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
    echo "$HEALTH_CHECK" | head -c 200
    echo ""
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo -e "${YELLOW}Check PM2 logs: pm2 logs medical-clinic-backend${NC}"
fi

echo -e "\n${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check PM2 logs: pm2 logs"
echo "2. Check backend health: curl http://localhost:3000/api/health"
echo "3. Test the application in your browser"
echo "4. Clear browser cache if needed"
echo ""
