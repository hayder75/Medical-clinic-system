#!/bin/bash

# Script to configure Nginx for both Inventory and Medical systems
# This ensures realbright.live points to inventory, and /d path works for medical

echo "=========================================="
echo "Nginx Configuration for Both Systems"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Backup existing config
echo "Backing up existing Nginx configuration..."
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Find inventory system port
echo ""
echo "Looking for inventory system..."
INVENTORY_PORT=""
INVENTORY_PATH=""

# Check common ports
for port in 8080 5000 4000 8000 3002 3003; do
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}Found service on port $port${NC}"
        # Check if it's the inventory system
        response=$(curl -s http://localhost:$port 2>/dev/null | head -20)
        if echo "$response" | grep -qi "invent\|inventory\|stock\|warehouse"; then
            INVENTORY_PORT=$port
            echo -e "${GREEN}This appears to be the inventory system!${NC}"
            break
        fi
    fi
done

# If not found, ask user
if [ -z "$INVENTORY_PORT" ]; then
    echo -e "${YELLOW}Could not auto-detect inventory system port.${NC}"
    echo "Please enter the port number where your inventory system runs:"
    read -p "Port: " INVENTORY_PORT
fi

# Check if inventory system is accessible
if ! curl -s http://localhost:$INVENTORY_PORT > /dev/null 2>&1; then
    echo -e "${RED}Warning: Cannot connect to inventory system on port $INVENTORY_PORT${NC}"
    echo "Please make sure the inventory system is running."
    read -p "Continue anyway? (y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ]; then
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "Creating Nginx Configuration"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  - realbright.live (/) → Inventory system (port $INVENTORY_PORT)"
echo "  - /d path → Medical system (port 3001)"
echo "  - /api → Medical backend (port 3000)"
echo "  - /uploads → Medical uploads (port 3000)"
echo ""

# Create Nginx configuration
cat > /tmp/nginx-medical-inventory.conf << 'NGINX_CONFIG'
# Main domain - Inventory System (realbright.live)
server {
    listen 80;
    server_name realbright.live www.realbright.live 51.222.143.50;

    # Medical system API (must come before /d location)
    location /d/api {
        rewrite ^/d/api(.*) /api$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /d;
    }

    # Medical system uploads (must come before /d location)
    location /d/uploads {
        rewrite ^/d/uploads(.*) /uploads$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Medical system access via /d path (for testing)
    location /d {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /d;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Handle SPA routing - all /d/* routes serve index.html
        try_files $uri $uri/ /d/index.html;
    }

    # Root path - Inventory System (must be last)
    location / {
        proxy_pass http://localhost:INVENTORY_PORT_PLACEHOLDER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_CONFIG

# Replace placeholder with actual port
sed "s/INVENTORY_PORT_PLACEHOLDER/$INVENTORY_PORT/g" /tmp/nginx-medical-inventory.conf > /etc/nginx/sites-available/default

echo -e "${GREEN}Configuration file created!${NC}"
echo ""

# Test Nginx configuration
echo "Testing Nginx configuration..."
if nginx -t; then
    echo -e "${GREEN}Nginx configuration is valid!${NC}"
    echo ""
    echo "Reloading Nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Nginx reloaded successfully!${NC}"
        echo ""
        echo "=========================================="
        echo -e "${GREEN}Configuration Complete!${NC}"
        echo "=========================================="
        echo ""
        echo "Access URLs:"
        echo "  - Inventory System: http://realbright.live"
        echo "  - Medical System:   http://51.222.143.50/d"
        echo ""
        echo "Both systems should now be accessible!"
    else
        echo -e "${RED}Failed to reload Nginx. Please check the error above.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Nginx configuration test failed!${NC}"
    echo "Restoring backup..."
    cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default 2>/dev/null || true
    exit 1
fi
