const express = require('express');
const router = express.Router();
const publicUsersController = require('../controllers/publicUsersController');

// Public User Login
router.post('/login', publicUsersController.login);

module.exports = router; 