@echo off
echo 🔄 Restarting Telegram Bot with Polling Mode...

REM Stop any existing pm2 processes for the bot
echo Stopping existing bot processes...
pm2 stop mental-health-backend 2>nul || echo No existing process found

REM Start the bot with pm2
echo Starting bot with polling mode...
pm2 start server.js --name mental-health-backend

REM Show logs
echo 📋 Bot logs:
pm2 logs mental-health-backend --lines 10

echo ✅ Bot restarted successfully!
echo 🔍 Check logs with: pm2 logs mental-health-backend
echo 🛑 Stop bot with: pm2 stop mental-health-backend
pause 