# Quick Deployment Guide

## Server IP: 51.222.143.50

## Step 1: Push to GitHub (Local Machine)

```bash
cd "/home/hayder/Downloads/Telegram Desktop/Medical-clinic-system-deployment (5)/Medical-clinic-system-deployment"

# Create GitHub repository first (via web interface), then:
git add -A
git commit -m "Initial commit - Medical Clinic System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Step 2: Deploy to Server

```bash
# SSH to server
ssh ubuntu@51.222.143.50

# Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git medical-clinic-system
cd medical-clinic-system

# Run deployment script
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Install all dependencies
- Setup database
- Run migrations
- Seed system data
- Build frontend
- Start services with PM2

## Step 3: Access the System

- **Frontend**: http://51.222.143.50:3001
- **Backend**: http://51.222.143.50:3000/api

## IP to Share with Client

**51.222.143.50:3001**


