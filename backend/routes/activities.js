const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/activities - return all activities
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM activities ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch activities.' });
  }
});

// PUT /api/activities/:id - update an activity
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, date, location, description } = req.body;
  try {
    await db.query(
      'UPDATE activities SET name=?, date=?, location=?, description=? WHERE id=?',
      [name, date, location, description, id]
    );
    res.json({ success: true, message: 'Activity updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update activity.' });
  }
});

// DELETE /api/activities/:id - delete an activity
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM activities WHERE id=?', [id]);
    res.json({ success: true, message: 'Activity deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete activity.' });
  }
});

module.exports = router; 