const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../utils/upload');

router.post('/add-counselor', upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), async (req, res) => {
  try {
    const { full_name, email, ic_number, age, phone_number, registration_number, location, address, latitude, longitude, password } = req.body;
    const profile_image = req.files && req.files['profile_image'] ? req.files['profile_image'][0].filename : null;
    const certificate = req.files && req.files['certificate'] ? req.files['certificate'][0].filename : null;
    const sql = `INSERT INTO counselors (full_name, email, ic_number, age, phone_number, registration_number, location, address, latitude, longitude, password, profile_image, certificate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [full_name, email, ic_number, age, phone_number, registration_number, location, address, latitude, longitude, password, profile_image, certificate];
    const [result] = await db.query(sql, values);
    res.json({ success: true, id: result.insertId, message: 'Counselor added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add counselor', error: error.message });
  }
});

module.exports = router; 