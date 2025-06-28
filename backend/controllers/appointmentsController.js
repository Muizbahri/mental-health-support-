const db = require('../models/db');

exports.createAppointment = async (req, res) => {
  try {
    const { role, name_patient, contact, assigned_to, status, date_time } = req.body;

    console.log("📥 Incoming appointment data:", req.body);

    if (!role || !name_patient || !contact || !assigned_to || !status || !date_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `
      INSERT INTO appointments (role, name_patient, contact, assigned_to, status, date_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(sql, [
      role,
      name_patient,
      contact,
      assigned_to,
      status,
      date_time
    ]);

    console.log("✅ Appointment inserted, ID:", result.insertId);
    res.status(201).json({ message: 'Appointment created', id: result.insertId });
  } catch (error) {
    console.error('❌ SQL Error:', error);
    res.status(500).json({ error: error.message || 'Server error while creating appointment' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { role, user } = req.query;
    let sql = "SELECT id, role, name_patient, contact, assigned_to, status, DATE_FORMAT(date_time, '%Y-%m-%d %H:%i:%s') as date_time, created_at FROM appointments";
    const params = [];
    const conditions = [];

    if (role) {
      conditions.push("role = ?");
      params.push(role);
    }

    if (user) {
      conditions.push("name_patient = ?");
      params.push(user);
    }
    
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get appointments assigned to a specific counselor (by name or id)
exports.getAppointmentsByCounselor = async (req, res) => {
  try {
    const { assigned_to } = req.params;
    // Join with user_public to get patient email
    const sql = `SELECT a.id, a.role, a.name_patient, a.contact, a.assigned_to, a.status, DATE_FORMAT(a.date_time, '%Y-%m-%d %H:%i:%s') as date_time, a.created_at, u.email as patient_email FROM appointments a LEFT JOIN user_public u ON a.name_patient = u.full_name WHERE a.assigned_to = ? ORDER BY a.date_time DESC`;
    const [rows] = await db.query(sql, [assigned_to]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments for counselor' });
  }
}; 