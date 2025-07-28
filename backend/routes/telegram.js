const express = require('express');
const router = express.Router();
const { sendTelegramMessage, findNearestProfessionals } = require('../utils/telegram');

// Bot instance is now handled in utils/telegram.js with polling mode

// Test route (already working)
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

// THIS IS THE ROUTE WE NEED!
router.post('/send-telegram', async (req, res) => {
  const { chatId, text } = req.body;
  try {
    await sendTelegramMessage(chatId, text);
    res.json({ success: true, message: 'Message sent to Telegram!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/find-nearest', async (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Missing coordinates' });
  }
  try {
    const nearest = await findNearestProfessionals(latitude, longitude);
    res.json({ success: true, data: nearest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 