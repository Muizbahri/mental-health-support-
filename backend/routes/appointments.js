const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createAppointment, getAppointments, getAppointmentsByCounselor } = require('../controllers/appointmentsController');

// POST /api/appointments - Create a new appointment
router.post('/', async (req, res) => {
  try {
    const { role, name_patient, contact, assigned_to, status, date_time } = req.body;
    if (!role || !name_patient || !contact || !assigned_to || !status || !date_time) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const sql = `INSERT INTO appointments (role, name_patient, contact, assigned_to, status, date_time) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [role, name_patient, contact, assigned_to, status, date_time]);
    res.status(201).json({ success: true, message: 'Appointment created successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/appointments/:id - Delete an appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM appointments WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    res.json({ success: true, message: 'Appointment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/appointments/:id - Update an appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, name_patient, contact, assigned_to, status, date_time } = req.body;
    if (!role || !name_patient || !contact || !assigned_to || !status || !date_time) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const sql = `UPDATE appointments SET role=?, name_patient=?, contact=?, assigned_to=?, status=?, date_time=? WHERE id=?`;
    const [result] = await db.query(sql, [role, name_patient, contact, assigned_to, status, date_time, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    res.json({ success: true, message: 'Appointment updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/create', createAppointment);
router.get('/', getAppointments);

// Add this route for counselor-specific appointments
router.get('/counselor/:assigned_to', getAppointmentsByCounselor);

// Add this route for psychiatrist-specific appointments
router.get('/psychiatrist/:assigned_to', getAppointmentsByCounselor);

module.exports = router; 