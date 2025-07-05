const express = require('express');
const router = express.Router();
const { sendTestEmail } = require('../controllers/emailTestController');

router.post('/test-email', sendTestEmail);

module.exports = router; 