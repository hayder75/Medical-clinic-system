# Medical Clinic System - Render.com Deployment Guide

## 🚀 Quick Deploy to Render.com

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. No credit card required!

### Step 2: Deploy Database
1. Click "New +" → "PostgreSQL"
2. Name: `medical-clinic-db`
3. Plan: **Free**
4. Click "Create Database"
5. **Copy the connection string** (you'll need this)

### Step 3: Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repo: `hayder75/Medical-clinic-system`
3. Settings:
   - **Name**: `medical-clinic-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste your database connection string>
   JWT_SECRET=your_jwt_secret_here
   CLOUDINARY_CLOUD_NAME=ddgukdjyd
   CLOUDINARY_API_KEY=769494294237147
   CLOUDINARY_API_SECRET=Ao9fnxTLDliaZoUYxSufOBIHVdQ
   ```

5. Click "Create Web Service"

### Step 4: Deploy Frontend
1. Click "New +" → "Static Site"
2. Connect your GitHub repo: `hayder75/Medical-clinic-system`
3. Settings:
   - **Name**: `medical-clinic-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: **Free**

4. **Environment Variables**:
   ```
   VITE_API_URL=https://medical-clinic-backend.onrender.com/api
   ```

5. Click "Create Static Site"

### Step 5: Update Frontend API URL
After backend deploys, update the frontend environment variable:
- Go to frontend service → Environment
- Update `VITE_API_URL` to your actual backend URL
- Redeploy frontend

## 🎯 Your URLs
- **Frontend**: `https://medical-clinic-frontend.onrender.com`
- **Backend**: `https://medical-clinic-backend.onrender.com`
- **Health Check**: `https://medical-clinic-backend.onrender.com/api/health`

## ✅ That's it! Your medical clinic system is live!
