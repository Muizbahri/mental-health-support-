const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const { uploadFile } = require('../controllers/uploadController');

router.post('/file', upload.single('file'), uploadFile);

module.exports = router; 