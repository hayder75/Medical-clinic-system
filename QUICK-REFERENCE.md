# Quick Reference - Server Setup

## 🎯 Access URLs

### For Your Clients (Inventory - Main System)
- **`https://realbright.live`** ← Main domain (Inventory System)
- **`https://www.realbright.live`** ← Also works

### For Testing (Medical System)  
- **`http://51.222.143.50/d`** ← Send this to your medical clients

## 📊 Current Setup

### Ports
- **3000**: Inventory Frontend (Next.js)
- **3001**: Medical Backend  
- **5000**: Inventory Backend API

### PM2 Processes
```bash
pm2 list
```

You should see:
- `inventmanager-backend` (port 5000)
- `inventmanager-frontend` (port 3000)  
- `medical-clinic-backend` (port 3001)

## 🔧 Quick Commands

### Check Status
```bash
pm2 list                    # Check all processes
sudo ss -tlnp | grep 3000   # Check ports
sudo systemctl status nginx # Check Nginx
```

### Restart Services
```bash
pm2 restart all             # Restart all PM2 processes
pm2 restart inventmanager-frontend
pm2 restart inventmanager-backend
pm2 restart medical-clinic-backend
sudo systemctl reload nginx # Reload Nginx config
```

### View Logs
```bash
pm2 logs                    # All logs
pm2 logs inventmanager-frontend
pm2 logs medical-clinic-backend
sudo tail -f /var/log/nginx/error.log
```

### Test URLs
```bash
curl -I http://localhost:3000        # Inventory frontend
curl -I http://localhost:5000/api   # Inventory API
curl -I http://51.222.143.50/d      # Medical system
```

## 🚨 If Something Breaks

### Inventory not showing on realbright.live?
1. Check if inventory is running: `pm2 list`
2. Check DNS: `dig realbright.live`
3. Check Nginx: `sudo nginx -t`
4. Restart: `pm2 restart inventmanager-frontend`

### Medical /d not working?
1. Check medical backend: `pm2 logs medical-clinic-backend`
2. Check port: `sudo ss -tlnp | grep 3001`
3. Restart: `pm2 restart medical-clinic-backend`

## 📝 Important Files

- Inventory Backend: `~/inventmanager/backend/.env` (PORT=5000)
- Medical Backend: `~/medical-clinic-system/backend/.env` (PORT=3001)
- Nginx Inventory: `/etc/nginx/sites-available/inventmanager`
- Nginx Medical: `/etc/nginx/sites-available/medical-clinic`

## ✅ Everything Working?

- ✅ `realbright.live` → Inventory System
- ✅ `51.222.143.50/d` → Medical System
- ✅ All PM2 processes online
- ✅ No port conflicts

---

**Last Updated**: Configuration complete and verified
