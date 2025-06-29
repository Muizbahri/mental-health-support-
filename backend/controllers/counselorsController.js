let db;
try {
  db = require('../config/db');
} catch (error) {
  console.error('Failed to load database in counselorsController:', error);
  // Export error handlers
  exports.getCounselors = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.getCounselorById = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.createCounselor = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.updateCounselor = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.deleteCounselor = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  return;
}

const counselorsModel = require('../models/counselors');

exports.getCounselors = async (req, res) => {
  try {
    const counselors = await counselorsModel.getAllCounselors();
    res.json({ success: true, data: counselors });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching counselors' });
  }
};

exports.getCounselorById = async (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM counselors WHERE id = ?`;
  try {
    const [rows] = await db.query(sql, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Counselor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCounselor = async (req, res) => {
  try {
    const { full_name, email, ic_number, age, phone_number, registration_number, location, address, latitude, longitude, password } = req.body;
    const certificate = req.files['certificate'] ? req.files['certificate'][0].filename : null;
    const profile_image = req.files['profile_image'] ? req.files['profile_image'][0].filename : null;

    const sql = `
      INSERT INTO counselors 
      (full_name, email, ic_number, age, phone_number, registration_number, certificate, profile_image, location, address, latitude, longitude, password, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [full_name, email, ic_number, age, phone_number, registration_number, certificate, profile_image, location, address, latitude, longitude, password];
    
    const [result] = await db.query(sql, values);
    res.status(201).json({ id: result.insertId, message: 'Counselor created successfully' });
  } catch (err) {
    console.error("Error creating counselor:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCounselor = async (req, res) => {
  const { id } = req.params;
  const { full_name, location, address, latitude, longitude } = req.body;
  const sql = `UPDATE counselors SET full_name = ?, location = ?, address = ?, latitude = ?, longitude = ? WHERE id = ?`;
  try {
    const [result] = await db.query(sql, [full_name, location, address, latitude, longitude, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Counselor not found' });
    res.json({ message: 'Counselor updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCounselor = async (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM counselors WHERE id = ?`;
  try {
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Counselor not found' });
    res.json({ message: 'Counselor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 