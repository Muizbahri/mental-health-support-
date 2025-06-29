const express = require('express');
const router = express.Router();

// Wrap database import in try-catch to prevent module loading errors
let db;
try {
  db = require('../config/db');
} catch (error) {
  console.error('Failed to load database in materials route:', error);
  // Export a router with error handlers
  router.use('*', (req, res) => {
    res.status(500).json({ success: false, message: 'Database connection error' });
  });
  module.exports = router;
  return;
}

// Get all materials
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM manage_materials ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all materials by type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const [rows] = await db.query('SELECT * FROM manage_materials WHERE type = ? ORDER BY created_at DESC', [type]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new material
router.post('/', async (req, res) => {
  try {
    const { type, title, upload, description } = req.body;
    if (!type || !title || !upload) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    await db.query(
      'INSERT INTO manage_materials (type, title, upload, description, created_at) VALUES (?, ?, ?, ?, NOW())',
      [type, title, upload, description || '']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update material by id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, upload, description } = req.body;
    await db.query(
      'UPDATE manage_materials SET type=?, title=?, upload=?, description=? WHERE id=?',
      [type, title, upload, description, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete material by id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM manage_materials WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 