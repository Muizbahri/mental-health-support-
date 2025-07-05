const express = require('express');
const router = express.Router();
const scrapeAndSaveActivities = require('../scrapeActivities');

// POST /api/scrape-activities
router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'URL is required' });
  console.log('Received scrape request for URL:', url);
  const result = await scrapeAndSaveActivities(url);
  if (result.success) {
    res.json({ success: true, message: result.message });
  } else {
    res.status(500).json({ success: false, message: result.message });
  }
});

module.exports = router; 