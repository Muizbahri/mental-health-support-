const express = require('express');
const router = express.Router();
const resetController = require('../controllers/resetController');

// Password reset routes
router.post('/request-reset', resetController.requestResetToken);
router.post('/reset-password', resetController.resetUserPassword);
router.post('/validate-token', resetController.validateResetToken);

module.exports = router; 