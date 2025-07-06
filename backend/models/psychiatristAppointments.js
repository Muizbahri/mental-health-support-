const db = require('../config/db');

exports.createPsychiatristAppointment = async ({ user_public_id, contact, assigned_to, psychiatrist_id, status, date_time, created_by }) => {
  if (!user_public_id || !contact || !assigned_to || !psychiatrist_id || !status || !date_time || !created_by) {
    throw new Error('Missing required fields');
  }
  // Fetch the latest full_name from user_public
  const [userRows] = await db.query('SELECT full_name FROM user_public WHERE id = ?', [user_public_id]);
  const name_patient = userRows[0]?.full_name || '';
  const [result] = await db.query(
    'INSERT INTO psychiatrist_appointments (name_patient, user_public_id, contact, assigned_to, psychiatrist_id, status, date_time, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [name_patient, user_public_id, contact, assigned_to, psychiatrist_id, status, date_time, created_by]
  );
  return result.insertId;
};

exports.getAllPsychiatristAppointments = async () => {
  const sql = `SELECT pa.id, pa.user_public_id, pa.contact, pa.assigned_to, pa.psychiatrist_id, pa.status, 
               DATE_FORMAT(pa.date_time, '%Y-%m-%d %H:%i:%s') as date_time, pa.created_by, pa.created_at,
               u.full_name as name_patient, u.email as patient_email, u.phone_number as patient_phone
               FROM psychiatrist_appointments pa
               LEFT JOIN user_public u ON pa.user_public_id = u.id
               ORDER BY pa.date_time DESC`;
  const [rows] = await db.query(sql);
  return rows;
};

exports.getPsychiatristAppointmentsByPsychiatristId = async (psychiatrist_id) => {
  const sql = `SELECT pa.id, pa.user_public_id, pa.contact, pa.assigned_to, pa.psychiatrist_id, pa.status, 
               DATE_FORMAT(pa.date_time, '%Y-%m-%d %H:%i:%s') as date_time, pa.created_by, pa.created_at,
               u.full_name as name_patient, u.email as patient_email, u.phone_number as patient_phone
               FROM psychiatrist_appointments pa
               LEFT JOIN user_public u ON pa.user_public_id = u.id
               WHERE pa.psychiatrist_id = ? ORDER BY pa.date_time DESC`;
  const [rows] = await db.query(sql, [psychiatrist_id]);
  return rows;
};

exports.getPsychiatristAppointmentsByUserId = async (user_public_id) => {
  const sql = `SELECT pa.id, pa.user_public_id, pa.contact, pa.assigned_to, pa.psychiatrist_id, pa.status, 
               DATE_FORMAT(pa.date_time, '%Y-%m-%d %H:%i:%s') as date_time, pa.created_by, pa.created_at,
               u.full_name as name_patient, u.email as patient_email, u.phone_number as patient_phone
               FROM psychiatrist_appointments pa
               LEFT JOIN user_public u ON pa.user_public_id = u.id
               WHERE pa.user_public_id = ? 
                 AND pa.date_time >= NOW()
                 AND pa.status IN ('Accepted', 'In Progress')
               ORDER BY pa.date_time ASC`;
  const [rows] = await db.query(sql, [user_public_id]);
  return rows;
};

exports.getAppointmentsForPsychiatrist = async (psychiatrist_id) => {
  const sql = `SELECT pa.id, pa.user_public_id, pa.contact, pa.assigned_to, pa.psychiatrist_id, pa.status, 
               DATE_FORMAT(pa.date_time, '%Y-%m-%d %H:%i:%s') as date_time, pa.created_by, pa.created_at,
               u.full_name as name_patient, u.email as patient_email, u.phone_number as patient_phone
               FROM psychiatrist_appointments pa
               LEFT JOIN user_public u ON pa.user_public_id = u.id
               WHERE pa.psychiatrist_id = ?`;
  const [rows] = await db.query(sql, [psychiatrist_id]);
  return rows;
};

exports.updatePsychiatristAppointment = async (id, { name_patient, user_public_id, contact, assigned_to, psychiatrist_id, status, date_time }) => {
  // If name_patient or user_public_id is not provided, fetch the current value
  let finalNamePatient = name_patient;
  let finalUserPublicId = user_public_id;
  if (!finalNamePatient || finalNamePatient.trim() === "" || !finalUserPublicId) {
    const [rows] = await db.query('SELECT name_patient, user_public_id FROM psychiatrist_appointments WHERE id = ?', [id]);
    if (rows.length > 0) {
      if (!finalNamePatient || finalNamePatient.trim() === "") {
        finalNamePatient = rows[0].name_patient;
      }
      if (!finalUserPublicId) {
        finalUserPublicId = rows[0].user_public_id;
      }
    }
  }
  const [result] = await db.query(
    'UPDATE psychiatrist_appointments SET name_patient=?, user_public_id=?, contact=?, assigned_to=?, psychiatrist_id=?, status=?, date_time=? WHERE id=?',
    [finalNamePatient, finalUserPublicId, contact, assigned_to, psychiatrist_id, status, date_time, id]
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