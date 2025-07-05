#!/bin/bash

# 502 Bad Gateway Fix Script for caremental.online
# Run this script on your VPS to diagnose and fix the issue

echo "🔍 Starting 502 Bad Gateway Diagnosis for caremental.online"
echo "======================================================="

# Function to check if a service is running
check_service_status() {
    local service=$1
    echo -n "Checking $service status: "
    if systemctl is-active --quiet $service; then
        echo "✅ Running"
        return 0
    else
        echo "❌ Not running"
        return 1
    fi
}

# Function to check if a port is listening
check_port() {
    local port=$1
    local service=$2
    echo -n "Checking port $port ($service): "
    if netstat -tlnp | grep -q ":$port "; then
        echo "✅ Listening"
        return 0
    else
        echo "❌ Not listening"
        return 1
    fi
}

echo
echo "1. 🔍 Checking System Services"
echo "================================"

# Check NGINX
check_service_status nginx
nginx_status=$?

# Check if PM2 is running
echo -n "Checking PM2 processes: "
if command -v pm2 >/dev/null 2>&1; then
    pm2_count=$(pm2 list | grep -c "online\|stopped\|errored")
    if [ $pm2_count -gt 0 ]; then
        echo "✅ PM2 found with $pm2_count processes"
        pm2_status=0
    else
        echo "❌ No PM2 processes found"
        pm2_status=1
    fi
else
    echo "❌ PM2 not installed"
    pm2_status=1
fi

echo
echo "2. 🔍 Checking Network Ports"
echo "============================="

# Check common ports
check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3000 "Frontend (Next.js)"
check_port 5000 "Backend (Express)"

echo
echo "3. 🔍 PM2 Process Status"
echo "========================"

if [ $pm2_status -eq 0 ]; then
    echo "Current PM2 processes:"
    pm2 status
    echo
    echo "Recent PM2 logs:"
    pm2 logs --lines 10
else
    echo "❌ PM2 not running - this is likely the cause of the 502 error"
fi

echo
echo "4. 🔍 NGINX Configuration Check"
echo "==============================="

# Check NGINX configuration
echo "Testing NGINX configuration:"
nginx -t

echo
echo "Current NGINX sites enabled:"
ls -la /etc/nginx/sites-enabled/

echo
echo "5. 🔍 Checking Application Directories"
echo "====================================="

# Check if application directories exist
if [ -d "/var/www/mental-health-support" ]; then
    echo "✅ Application directory found: /var/www/mental-health-support"
    cd /var/www/mental-health-support
    echo "Directory contents:"
    ls -la
elif [ -d "/home/ubuntu/mental-health-support" ]; then
    echo "✅ Application directory found: /home/ubuntu/mental-health-support"
    cd /home/ubuntu/mental-health-support
    echo "Directory contents:"
    ls -la
else
    echo "❌ Application directory not found in common locations"
    echo "Current directory: $(pwd)"
    find / -name "mental-health-support" -type d 2>/dev/null | head -5
fi

echo
echo "6. 🔧 FIXING ISSUES"
echo "==================="

# Fix 1: Restart NGINX if it's having issues
if [ $nginx_status -ne 0 ]; then
    echo "🔧 Restarting NGINX..."
    sudo systemctl restart nginx
    sleep 2
    check_service_status nginx
fi

# Fix 2: Check if we're in the right directory and start/restart PM2
if [ -f "ecosystem.config.js" ] || [ -f "package.json" ]; then
    echo "🔧 Found application files in current directory"
    
    # Check if backend directory exists
    if [ -d "backend" ]; then
        echo "🔧 Starting/Restarting backend with PM2..."
        cd backend
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing backend dependencies..."
            npm install
        fi
        
        # Start backend with PM2
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js --env production
        else
            pm2 start server.js --name "mental-health-backend" --env production
        fi
        
        cd ..
    fi
    
    # Check if frontend exists and build it
    if [ -d "." ] && [ -f "package.json" ]; then
        echo "🔧 Building and starting frontend..."
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing frontend dependencies..."
            npm install
        fi
        
        # Build the frontend
        echo "🏗️ Building frontend..."
        npm run build
        
        # Start frontend with PM2
        pm2 start "npm run start" --name "mental-health-frontend" --env production
    fi
else
    echo "❌ Application files not found in current directory"
    echo "Please navigate to your application directory and run this script again"
fi

echo
echo "7. 🔧 Final System Restart"
echo "=========================="

# Restart PM2 processes
echo "🔧 Restarting all PM2 processes..."
pm2 restart all

# Reload NGINX
echo "🔧 Reloading NGINX configuration..."
sudo systemctl reload nginx

# Wait a moment for services to start
echo "⏳ Waiting for services to stabilize..."
sleep 5

echo
echo "8. 🔍 Final Status Check"
echo "========================"

echo "NGINX Status:"
check_service_status nginx

echo
echo "PM2 Status:"
pm2 status

echo
echo "Port Status:"
check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3000 "Frontend"
check_port 5000 "Backend"

echo
echo "9. 🌐 Testing Website"
echo "===================="

echo "Testing website connectivity..."
if curl -I https://caremental.online 2>/dev/null | grep -q "200\|301\|302"; then
    echo "✅ Website is responding!"
else
    echo "❌ Website still not responding"
    echo "Additional debugging needed..."
fi

echo
echo "🎉 Script completed!"
echo "==================="
echo "If the website is still showing 502 errors, please check:"
echo "1. Database connection (if using external database)"
echo "2. Environment variables in .env files"
echo "3. Firewall settings"
echo "4. Server resources (RAM, CPU, disk space)"
echo
echo "For more help, check the logs:"
echo "- NGINX logs: sudo tail -f /var/log/nginx/error.log"
echo "- PM2 logs: pm2 logs"
echo "- System logs: sudo journalctl -u nginx -f" 