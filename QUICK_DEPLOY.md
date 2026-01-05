# Quick Deployment Guide

## One-Command Deployment

After any code changes, simply run this on your server:

```bash
cd medical-clinic-system && bash deploy.sh
```

This script automatically:
1. ✅ Pulls latest code from GitHub
2. ✅ Installs/updates dependencies (if needed)
3. ✅ Builds the frontend
4. ✅ Stops and removes old PM2 processes
5. ✅ Starts backend and frontend servers
6. ✅ Checks backend health
7. ✅ Shows PM2 status

## Server Commands

```bash
# SSH to server
ssh ubuntu@51.222.143.50

# Navigate and deploy
cd medical-clinic-system
bash deploy.sh
```

## Manual Commands (if needed)

```bash
# Pull code
git pull origin main

# Backend
cd backend
npm install  # Only if dependencies changed
cd ..

# Frontend
cd frontend
npm install  # Only if dependencies changed
npm run build
cd ..

# PM2
pm2 stop all
pm2 delete all
cd backend && pm2 start server.js --name medical-clinic-backend
cd ../frontend && pm2 start server-frontend.js --name medical-clinic-frontend
pm2 save
pm2 list
```

## Checking Status

```bash
# PM2 status
pm2 list

# View logs
pm2 logs

# Backend health
curl http://localhost:3000/api/health
```

## Troubleshooting

If deployment fails:
1. Check PM2 logs: `pm2 logs medical-clinic-backend`
2. Check if ports are in use: `sudo lsof -i :3000`
3. Verify .env file exists: `ls backend/.env`
4. Check database connection in .env file
