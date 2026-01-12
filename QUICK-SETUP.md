# Quick Setup Instructions

## Summary
✅ **Medical system frontend code has been updated** to work with `/d` path
✅ **Configuration script created** to set up Nginx

## What You Need to Do

### Step 1: Find Your Inventory System Port
```bash
# Option A: Check running services
netstat -tlnp | grep LISTEN

# Option B: Check inventory system config
cd ~/inventmanager  # or wherever it is
grep -r "PORT\|port" .env package.json server.js 2>/dev/null | head -5
```

### Step 2: Run the Configuration Script
```bash
cd ~/Medical-clinic-system
sudo ./configure-nginx-for-both-systems.sh
```

The script will:
- Ask for inventory system port (if not auto-detected)
- Backup current Nginx config
- Configure Nginx properly
- Test and reload

### Step 3: Restart Medical System (if needed)
If you're running the medical system in dev mode, the code changes are already active.
If using production build, rebuild:
```bash
cd ~/Medical-clinic-system/frontend
npm run build
```

## Result

After setup:
- ✅ `http://realbright.live` → **Inventory System** (main)
- ✅ `http://51.222.143.50/d` → **Medical System** (testing)

## Alternative: Direct Port Access

You can also access medical system directly:
- Frontend: `http://51.222.143.50:3001`
- Backend: `http://51.222.143.50:3000/api`

Make sure ports are open:
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

## Files Changed

1. `frontend/src/services/api.js` - Updated to detect `/d` path
2. `frontend/src/utils/imageUrl.js` - Updated to handle `/d` path for images
3. `configure-nginx-for-both-systems.sh` - Configuration script
4. `NGINX-SETUP-GUIDE.md` - Detailed guide

## Need Help?

Check `NGINX-SETUP-GUIDE.md` for detailed instructions and troubleshooting.
