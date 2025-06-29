const express = require('express');
const router = express.Router();

// Wrap database import in try-catch to prevent module loading errors
let db;
try {
  db = require('../config/db');
} catch (error) {
  console.error('Failed to load database in emergency_cases route:', error);
  // Export a router with error handlers
  router.use('*', (req, res) => {
    res.status(500).json({ success: false, message: 'Database connection error' });
  });
  module.exports = router;
  return;
}

// POST /api/emergency_cases - Create a new emergency case
router.post('/', async (req, res) => {
  try {
    const { name_patient, ic_number, date_time, status, assigned_to, role } = req.body;
    if (!name_patient || !ic_number || !date_time || !status || !assigned_to || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const sql = `INSERT INTO emergency_cases (name_patient, ic_number, date_time, status, assigned_to, role) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [name_patient, ic_number, date_time, status, assigned_to, role]);
    res.status(201).json({ success: true, message: 'Emergency case created successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/emergency_cases - List all emergency cases, or filter by assigned_to
router.get('/', async (req, res) => {
  try {
    const { assigned_to } = req.query;
    let sql = 'SELECT * FROM emergency_cases';
    const params = [];
    if (assigned_to) {
      sql += ' WHERE assigned_to = ?';
      params.push(assigned_to);
    }
    sql += ' ORDER BY date_time DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/emergency_cases/:id - Delete an emergency case by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM emergency_cases WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Emergency case not found.' });
    }
    res.json({ success: true, message: 'Emergency case deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/emergency_cases/:id - Update an emergency case by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name_patient, ic_number, date_time, status, assigned_to, role } = req.body;
    if (!name_patient || !ic_number || !date_time || !status || !assigned_to || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const sql = `UPDATE emergency_cases SET name_patient=?, ic_number=?, date_time=?, status=?, assigned_to=?, role=? WHERE id=?`;
    const [result] = await db.query(sql, [name_patient, ic_number, date_time, status, assigned_to, role, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Emergency case not found.' });
    }
    res.json({ success: true, message: 'Emergency case updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 