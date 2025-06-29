let db;
try {
  db = require('../config/db');
} catch (error) {
  console.error('Failed to load database in patientCasesController:', error);
  // Export error handlers
  exports.getAllPatientCases = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.getPatientCasesByPsychiatrist = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.getPatientCaseById = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.createPatientCase = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.updatePatientCase = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.deletePatientCase = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  return;
}

// GET all patient cases, with optional filter by assigned_to
exports.getAllPatientCases = async (req, res) => {
  try {
    const { assigned_to } = req.query;
    let sql = 'SELECT * FROM patient_cases';
    const params = [];
    if (assigned_to) {
      sql += ' WHERE assigned_to = ?';
      params.push(assigned_to);
    }
    sql += ' ORDER BY last_visit DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all patient cases for a specific psychiatrist (by assigned_to)
exports.getPatientCasesByPsychiatrist = async (req, res) => {
  try {
    const { psychiatrist } = req.params;
    const [rows] = await db.query('SELECT * FROM patient_cases WHERE assigned_to = ? ORDER BY last_visit DESC', [psychiatrist]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET a single patient case by id
exports.getPatientCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM patient_cases WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient case not found.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create a new patient case
exports.createPatientCase = async (req, res) => {
  try {
    const { patient_name, diagnosis, last_visit, status, assigned_to } = req.body;
    if (!patient_name || !diagnosis || !last_visit || !status || !assigned_to) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const sql = 'INSERT INTO patient_cases (patient_name, diagnosis, last_visit, status, assigned_to) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.query(sql, [patient_name, diagnosis, last_visit, status, assigned_to]);
    res.status(201).json({ success: true, message: 'Patient case created successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update a patient case by id
exports.updatePatientCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, diagnosis, last_visit, status, assigned_to } = req.body;
    if (!patient_name || !diagnosis || !last_visit || !status || !assigned_to) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const sql = 'UPDATE patient_cases SET patient_name=?, diagnosis=?, last_visit=?, status=?, assigned_to=? WHERE id=?';
    const [result] = await db.query(sql, [patient_name, diagnosis, last_visit, status, assigned_to, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Patient case not found.' });
    }
    res.json({ success: true, message: 'Patient case updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE a patient case by id
exports.deletePatientCase = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM patient_cases WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Patient case not found.' });
    }
    res.json({ success: true, message: 'Patient case deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 