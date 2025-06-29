let db;
try {
  db = require('../config/db');
} catch (error) {
  console.error('Failed to load database in psychiatristsController:', error);
  // Export error handlers
  exports.getPsychiatrists = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.getPsychiatristById = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.createPsychiatrist = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.updatePsychiatrist = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.deletePsychiatrist = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  return;
}

const psychiatristsModel = require('../models/psychiatrists');

exports.getPsychiatrists = async (req, res) => {
  try {
    const psychiatrists = await psychiatristsModel.getAllPsychiatrists();
    res.json({ success: true, data: psychiatrists });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching psychiatrists' });
  }
};

exports.getPsychiatristById = async (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM psychiatrists WHERE id = ?`;
  try {
    const [rows] = await db.query(sql, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Psychiatrist not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPsychiatrist = async (req, res) => {
  try {
    const { full_name, email, ic_number, age, phone_number, med_number, location, address, latitude, longitude, password } = req.body;
    const certificate = req.files['certificate'] ? req.files['certificate'][0].filename : null;
    const profile_image = req.files['profile_image'] ? req.files['profile_image'][0].filename : null;

    const sql = `
      INSERT INTO psychiatrists 
      (full_name, email, ic_number, age, phone_number, med_number, certificate, profile_image, location, address, latitude, longitude, password, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [full_name, email, ic_number, age, phone_number, med_number, certificate, profile_image, location, address, latitude, longitude, password];
    
    const [result] = await db.query(sql, values);
    res.status(201).json({ id: result.insertId, message: 'Psychiatrist created successfully' });
  } catch (err) {
    console.error("Error creating psychiatrist:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updatePsychiatrist = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, ic_number, age, phone_number, med_number, location, address, latitude, longitude, password } = req.body;
  const sql = `UPDATE psychiatrists SET full_name = ?, email = ?, ic_number = ?, age = ?, phone_number = ?, med_number = ?, location = ?, address = ?, latitude = ?, longitude = ?, password = ? WHERE id = ?`;
  try {
    const [result] = await db.query(sql, [full_name, email, ic_number, age, phone_number, med_number, location, address, latitude, longitude, password, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Psychiatrist not found' });
    res.json({ message: 'Psychiatrist updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePsychiatrist = async (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM psychiatrists WHERE id = ?`;
  try {
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Psychiatrist not found' });
    res.json({ message: 'Psychiatrist deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 