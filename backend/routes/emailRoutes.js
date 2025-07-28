const express = require('express');
const router = express.Router();
const { sendTestEmail } = require('../controllers/emailController');

router.post('/test-email', sendTestEmail);

module.exports = router; 