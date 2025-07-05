const db = require('../config/db');

exports.createPsychiatristAppointment = async ({ name_patient, contact, assigned_to, psychiatrist_id, status, date_time, created_by }) => {
  if (!name_patient || !contact || !assigned_to || !psychiatrist_id || !status || !date_time || !created_by) {
    throw new Error('Missing required fields');
  }
  const [result] = await db.query(
    'INSERT INTO psychiatrist_appointments (name_patient, contact, assigned_to, psychiatrist_id, status, date_time, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
    [name_patient, contact, assigned_to, psychiatrist_id, status, date_time, created_by]
  );
  return result.insertId;
};

exports.getAllPsychiatristAppointments = async () => {
  const [rows] = await db.query('SELECT id, name_patient, contact, assigned_to, psychiatrist_id, status, DATE_FORMAT(date_time, \'%Y-%m-%d %H:%i:%s\') as date_time, created_by, created_at FROM psychiatrist_appointments ORDER BY date_time DESC');
  return rows;
};

exports.getPsychiatristAppointmentsByPsychiatristId = async (psychiatrist_id) => {
  const [rows] = await db.query('SELECT id, name_patient, contact, assigned_to, psychiatrist_id, status, DATE_FORMAT(date_time, \'%Y-%m-%d %H:%i:%s\') as date_time, created_by, created_at FROM psychiatrist_appointments WHERE psychiatrist_id = ? ORDER BY date_time DESC', [psychiatrist_id]);
  return rows;
};

exports.getAppointmentsForPsychiatrist = async (psychiatrist_id) => {
  const [rows] = await db.query('SELECT id, name_patient, contact, assigned_to, psychiatrist_id, status, DATE_FORMAT(date_time, \'%Y-%m-%d %H:%i:%s\') as date_time, created_by, created_at FROM psychiatrist_appointments WHERE psychiatrist_id = ?', [psychiatrist_id]);
  return rows;
};

exports.updatePsychiatristAppointment = async (id, { name_patient, contact, assigned_to, psychiatrist_id, status, date_time }) => {
  const [result] = await db.query(
    'UPDATE psychiatrist_appointments SET name_patient=?, contact=?, assigned_to=?, psychiatrist_id=?, status=?, date_time=? WHERE id=?',
    [name_patient, contact, assigned_to, psychiatrist_id, status, date_time, id]
  );
  return result.affectedRows > 0;
};

exports.deletePsychiatristAppointment = async (id) => {
  const [result] = await db.query('DELETE FROM psychiatrist_appointments WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

exports.checkPsychiatristAppointmentConflict = async (psychiatrist_id, date_time, excludeId = null) => {
  try {
    // Convert date_time to MySQL compatible format and extract date and hour
    const appointmentDate = new Date(date_time);
    const dateStr = appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const hour = appointmentDate.getHours();
    
    let sql = `SELECT id, date_time, assigned_to FROM psychiatrist_appointments 
               WHERE psychiatrist_id = ? 
               AND DATE(date_time) = ? 
               AND HOUR(date_time) = ?`;
    const params = [psychiatrist_id, dateStr, hour];
    
    // If updating an existing appointment, exclude it from the conflict check
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    console.log('Checking psychiatrist appointment conflict:', {
      psychiatrist_id,
      date_time,
      dateStr,
      hour,
      excludeId,
      sql,
      params
    });
    
    const [rows] = await db.query(sql, params);
    
    if (rows.length > 0) {
      console.log('Psychiatrist conflict found:', rows);
    } else {
      console.log('No psychiatrist conflict found');
    }
    
    return rows.length > 0; // Return true if conflict exists (any appointment in same hour)
  } catch (error) {
    console.error('Error in checkPsychiatristAppointmentConflict:', error);
    return false; // On error, allow the appointment to proceed
  }
}; 