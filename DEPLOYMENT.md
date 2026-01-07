# Deployment Guide - Medical Clinic System

## Server IP: 51.222.143.50

## Quick Deployment Steps

### 1. On Your Local Machine (Prepare Code)

```bash
# Make sure you're in the project directory
cd "/home/hayder/Downloads/Telegram Desktop/Medical-clinic-system-deployment (5)/Medical-clinic-system-deployment"

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Medical Clinic System"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. On the Server (SSH Connection)

```bash
# SSH to server
ssh ubuntu@51.222.143.50

# Clone the repository
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git medical-clinic-system
cd medical-clinic-system

# Make deploy script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

### 3. After Deployment

The deployment script will:
- Install all dependencies (Node.js, PostgreSQL, PM2, Nginx)
- Setup database
- Run migrations
- Seed system data (services, lab tests, medications, insurance - NO users/patients)
- Build frontend
- Start backend and frontend with PM2

### 4. Access the System

- **Frontend**: http://51.222.143.50:3001
- **Backend API**: http://51.222.143.50:3000/api

### 5. Next Steps

1. **Create Admin User**: You'll need to create an admin user. You can either:
   - Use the admin panel (if there's a way to create first admin)
   - Or run a script to create the first admin user

2. **Configure Firewall** (if needed):
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow 3001/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

3. **PM2 Commands**:
   ```bash
   pm2 status                    # Check status
   pm2 logs medical-clinic-backend    # View backend logs
   pm2 logs medical-clinic-frontend   # View frontend logs
   pm2 restart all              # Restart all services
   ```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medical_clinic_system
JWT_SECRET=your_jwt_secret_key_here_change_this
PORT=3000
```

### Frontend (.env)
```
VITE_API_URL=http://51.222.143.50:3000/api
```

**Note**: The frontend will automatically use the current hostname if VITE_API_URL is not set, but it's recommended to set it explicitly for production.



