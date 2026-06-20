#!/bin/bash
# VPS Setup script for Ubuntu 24.04
# Host domain: report.leip.co.in

# Exit on error
set -e

echo "=== Updating packages ==="
sudo apt update && sudo apt upgrade -y

echo "=== Installing Node.js LTS & build dependencies ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential

echo "=== Installing PM2 globally ==="
sudo npm install -y -g pm2

echo "=== Installing Nginx ==="
sudo apt install -y nginx

echo "=== Creating deploy directory ==="
sudo mkdir -p /var/www/work-report
sudo chown -R $USER:$USER /var/www/work-report

echo "=== Configuring Nginx reverse proxy ==="
NGINX_CONF="/etc/nginx/sites-available/report.leip.co.in"

sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    listen 80;
    server_name report.leip.co.in;

    # Backend Express API Proxy
    location /api {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Frontend assets served directly
    location / {
        root /var/www/work-report/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Increase upload limit for larger report exports & attachments
    client_max_body_size 200M;
}
EOF

# Enable configuration
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default || true

echo "=== Testing Nginx Configuration ==="
sudo nginx -t

echo "=== Restarting Nginx ==="
sudo systemctl restart nginx

echo "=== Configuring Firewall ==="
sudo ufw allow 'Nginx Full' || true

echo "=== Installing Certbot for SSL (HTTPS) ==="
sudo apt install -y certbot python3-certbot-nginx
echo "=== Setup complete! ==="
echo "You can now generate SSL by running: sudo certbot --nginx -d report.leip.co.in"
