# Quick 502 Bad Gateway Fix Commands

## SSH into your VPS and run these commands:

### 1. Check Current Status
```bash
# Check if NGINX is running
sudo systemctl status nginx

# Check PM2 processes
pm2 status
pm2 logs --lines 20

# Check ports
sudo netstat -tlnp | grep -E ':80|:443|:3000|:5000'
```

### 2. Navigate to Application Directory
```bash
# Find your application directory
cd /var/www/mental-health-support
# OR
cd /home/ubuntu/mental-health-support
# OR
cd /root/mental-health-support
```

### 3. Restart Backend (Express/Node.js)
```bash
# Navigate to backend directory
cd backend

# Install dependencies if needed
npm install

# Start/restart with PM2
pm2 start server.js --name "mental-health-backend" --env production
# OR if you have ecosystem.config.js:
pm2 start ecosystem.config.js --env production
```

### 4. Restart Frontend (Next.js)
```bash
# Navigate back to root directory
cd ..

# Install dependencies if needed
npm install

# Build the frontend
npm run build

# Start with PM2
pm2 start "npm run start" --name "mental-health-frontend" --env production
```

### 5. Fix NGINX and Restart Services
```bash
# Test NGINX configuration
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx

# Restart all PM2 processes
pm2 restart all

# Save PM2 processes
pm2 save
```

### 6. Check Final Status
```bash
# Check services
sudo systemctl status nginx
pm2 status

# Test website
curl -I https://caremental.online
```

### 7. If Still Not Working - Check Logs
```bash
# NGINX error logs
sudo tail -f /var/log/nginx/error.log

# PM2 logs
pm2 logs

# System logs
sudo journalctl -u nginx -f
```

## Common Issues and Solutions:

### Issue: PM2 processes not running
```bash
pm2 kill
pm2 start ecosystem.config.js --env production
```

### Issue: Port conflicts
```bash
# Kill processes on specific ports
sudo kill -9 $(sudo lsof -t -i:3000)
sudo kill -9 $(sudo lsof -t -i:5000)
```

### Issue: Database connection
```bash
# Check if database is running (if using MongoDB)
sudo systemctl status mongod

# Check MySQL
sudo systemctl status mysql
```

### Issue: Environment variables
```bash
# Check if .env files exist
ls -la .env*
cat .env.local
```

## Run the automated fix script:
```bash
# Upload the fix script to your server, then:
chmod +x fix_502_error.sh
./fix_502_error.sh
``` 