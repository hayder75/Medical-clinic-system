# Nginx Configuration Guide for Both Systems

## Current Situation
- **Inventory System**: Should be accessible at `http://realbright.live` (main domain)
- **Medical System**: Should be accessible at `http://51.222.143.50/d` (for testing)

## What Was Changed

### Frontend Code Updates
The medical system frontend has been updated to automatically detect when it's being served from the `/d` path and adjust API calls accordingly:
- API calls will go to `/d/api` instead of `/api`
- Image URLs will use `/d/uploads` instead of `/uploads`

### Next Steps

1. **Find your inventory system port:**
   ```bash
   # Check what ports are in use
   netstat -tlnp | grep LISTEN
   
   # Or check the inventory system's configuration
   cd ~/inventmanager
   # Look for port in package.json, .env, or server files
   ```

2. **Run the configuration script:**
   ```bash
   cd ~/Medical-clinic-system
   sudo ./configure-nginx-for-both-systems.sh
   ```
   
   The script will:
   - Ask you for the inventory system port (if not auto-detected)
   - Backup your current Nginx config
   - Create a new configuration
   - Test and reload Nginx

3. **Rebuild the medical frontend (if needed):**
   ```bash
   cd ~/Medical-clinic-system/frontend
   npm run build
   ```
   
   Note: If you're running in dev mode (npm run dev), the changes are already active.

## Access URLs After Configuration

- **Inventory System**: `http://realbright.live` or `http://51.222.143.50`
- **Medical System**: `http://51.222.143.50/d`

## Alternative: Direct Port Access

If you want to access the medical system directly without Nginx:
- **Frontend**: `http://51.222.143.50:3001`
- **Backend API**: `http://51.222.143.50:3000/api`

Make sure ports 3000 and 3001 are open in your firewall:
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

## Troubleshooting

1. **Check Nginx status:**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

2. **Check Nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

3. **Restore backup if needed:**
   ```bash
   sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Manual Nginx Configuration

If the script doesn't work, you can manually edit `/etc/nginx/sites-available/default`:

```nginx
server {
    listen 80;
    server_name realbright.live www.realbright.live 51.222.143.50;

    # Medical API
    location /d/api {
        rewrite ^/d/api(.*) /api$1 break;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Medical uploads
    location /d/uploads {
        rewrite ^/d/uploads(.*) /uploads$1 break;
        proxy_pass http://localhost:3000;
    }

    # Medical frontend
    location /d {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Inventory system (root)
    location / {
        proxy_pass http://localhost:INVENTORY_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Replace `INVENTORY_PORT` with your actual inventory system port.
