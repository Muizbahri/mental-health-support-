const db = require('./db');

exports.createEmergencyCase = async ({ name_patient, ic_number, date_time, status, assigned_to, role, counselor_id, psychiatrist_id }) => {
  const sql = `INSERT INTO emergency_cases (name_patient, ic_number, date_time, status, assigned_to, counselor_id, psychiatrist_id, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  const params = [
    name_patient, 
    ic_number, 
    date_time, 
    status || 'In Progress', 
    assigned_to || null, 
    counselor_id || null, 
    psychiatrist_id || null, 
    role || null
  ];
  
  console.log('Creating emergency case with params:', params);
  
  const [result] = await db.query(sql, params);
  
  console.log('Emergency case created successfully with ID:', result.insertId);
  
  return result.insertId;
};

exports.createPublicEmergencyCase = async ({ name_patient, ic_number }) => {
  const sql = `INSERT INTO emergency_cases (name_patient, ic_number) VALUES (?, ?)`;
  const [result] = await db.query(sql, [name_patient, ic_number]);
  return result.insertId;
};

exports.getAllEmergencyCases = async (filter = {}) => {
  let sql = 'SELECT * FROM emergency_cases';
  const params = [];
  
  // Only apply WHERE clause if filters are provided
  if (filter.psychiatrist_id) {
    sql += ' WHERE psychiatrist_id = ?';
    params.push(filter.psychiatrist_id);
  } else if (filter.counselor_id) {
    sql += ' WHERE counselor_id = ?';
    params.push(filter.counselor_id);
  }
  
  sql += ' ORDER BY created_at DESC, id DESC';
  console.log('Executing emergency cases query:', sql, 'with params:', params);
  
  const [rows] = await db.query(sql, params);
  console.log(`Found ${rows.length} emergency cases in database`);
  
  return rows;
};

exports.deleteEmergencyCase = async (id) => {
  const [result] = await db.query('DELETE FROM emergency_cases WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

exports.updateEmergencyCase = async (id, { name_patient, ic_number, date_time, status, assigned_to, role, counselor_id, psychiatrist_id }) => {
  const sql = `UPDATE emergency_cases SET name_patient=?, ic_number=?, date_time=?, status=?, assigned_to=?, counselor_id=?, psychiatrist_id=?, role=? WHERE id=?`;
  const params = [name_patient, ic_number, date_time, status, assigned_to, counselor_id, psychiatrist_id, role, id];
  
  console.log('Updating emergency case with ID:', id);
  console.log('Update params:', params);
  
  const [result] = await db.query(sql, params);
  
  console.log('Emergency case update result:', { affectedRows: result.affectedRows, success: result.affectedRows > 0 });
  
  return result.affectedRows > 0;
};

exports.findByPsychiatristId = async (psychiatrist_id) => {
  console.log("Finding cases for psychiatrist ID:", psychiatrist_id);
  // Convert to number to ensure proper comparison
  const numericId = Number(psychiatrist_id);
  
  // First, let's see all emergency cases to debug
  const [allCases] = await db.query('SELECT id, name_patient, psychiatrist_id, assigned_to FROM emergency_cases ORDER BY id DESC');
  console.log("All emergency cases in database:");
  allCases.forEach(caseItem => {
    console.log(`  ID ${caseItem.id}: ${caseItem.name_patient} - psychiatrist_id: ${caseItem.psychiatrist_id}, assigned_to: ${caseItem.assigned_to}`);
  });
  
  const [rows] = await db.query('SELECT * FROM emergency_cases WHERE psychiatrist_id = ?', [numericId]);
  console.log(`Found ${rows.length} emergency cases for psychiatrist ID ${numericId}`);
  return rows;
};

exports.getByPsychiatristId = async (psychiatrist_id) => {
  const [rows] = await db.query('SELECT * FROM emergency_cases WHERE psychiatrist_id = ?', [psychiatrist_id]);
  return rows;
};

// Add method to get a single emergency case by ID
exports.getEmergencyCaseById = async (id) => {
  const [rows] = await db.query('SELECT * FROM emergency_cases WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
}; 