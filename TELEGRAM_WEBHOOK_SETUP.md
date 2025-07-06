# 🤖 Telegram Webhook Setup Guide

## ✅ Changes Made

I've successfully converted your Telegram bot from polling to webhook mode. Here's what was changed:

### 1. **Updated `backend/utils/telegram.js`**
- Removed polling configuration (`{ polling: true }`)
- Added webhook setup using environment variables
- Bot now initializes in webhook mode

### 2. **Updated `backend/routes/telegram.js`**
- Added webhook endpoint at `/api/telegram/webhook`
- Telegram messages now processed through webhook

### 3. **Updated `backend/server.js`**
- Removed direct require of telegram utility (was causing polling conflicts)
- Added proper database connection initialization

### 4. **Created Helper Scripts**
- `backend/test-webhook.js` - Test webhook configuration
- `backend/webhook-setup.js` - Setup and verify webhook

## 🔧 Environment Variables Required

Make sure your `backend/.env` file has these variables:

```env
TELEGRAM_BOT_TOKEN=your_actual_bot_token_here
BASE_URL=https://your-domain.com
USE_WEBHOOK=true
NODE_ENV=production
```

## 🚀 Steps to Complete Setup

### Step 1: Clear any existing webhook/polling conflicts
```bash
cd backend
node webhook-setup.js
```

### Step 2: Restart your server
```bash
# If using PM2
pm2 restart ecosystem.config.js

# Or if running locally
npm run dev:backend
```

### Step 3: Test the webhook
```bash
cd backend
node test-webhook.js
```

### Step 4: Verify webhook is working
Send a message to your bot in Telegram and check server logs for webhook activity.

## 🔍 Expected Results

After setup, you should see:
- ✅ No more `polling_error` messages
- ✅ Webhook URL set to: `https://your-domain.com/api/telegram/webhook`
- ✅ Server logs showing webhook requests instead of polling
- ✅ Bot responding to messages normally

## 🐛 Troubleshooting

### If webhook fails to set:
1. Verify `BASE_URL` is correct and accessible
2. Check if your VPS firewall allows HTTPS traffic
3. Ensure SSL certificate is valid

### If bot doesn't respond:
1. Check server logs for webhook POST requests
2. Verify webhook endpoint is receiving data
3. Test with: `curl -X POST https://your-domain.com/api/telegram/webhook`

### Manual webhook verification:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## 🎯 Production Deployment

For production deployment, make sure:
1. Set `NODE_ENV=production` in your `.env`
2. Set `USE_WEBHOOK=true` in your `.env`
3. Your `BASE_URL` points to your live domain with HTTPS
4. Run the webhook-setup script after deployment

## 📋 What's Next

1. Run the setup commands above
2. Test the bot functionality
3. Monitor server logs to ensure no polling errors
4. Clean up test files if desired:
   ```bash
   rm backend/test-webhook.js
   rm backend/webhook-setup.js
   ```

The webhook setup is now complete and ready for production use! 