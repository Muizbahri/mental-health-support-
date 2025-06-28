const express = require('express');
const router = express.Router();
const { sendTestMail } = require('../utils/mailer');

router.post('/send-mail', async (req, res) => {
  const { to, subject, text } = req.body;
  try {
    await sendTestMail(to, subject, text);
    res.json({ success: true, message: 'Email sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 