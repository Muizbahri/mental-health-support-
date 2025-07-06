const db = require('../config/db');

function toMySQLDatetime(str) {
  if (!str) return str;
  // If already in 'YYYY-MM-DD HH:MM:SS' format
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) return str;
  // If 'YYYY-MM-DDTHH:MM:SS'
  if (str.length === 19 && str[10] === 'T') return str.replace('T', ' ');
  // If 'YYYY-MM-DDTHH:MM'
  if (str.length === 16 && str[10] === 'T') return str.replace('T', ' ') + ':00';
  // If 'YYYY-MM-DD HH:MM'
  if (str.length === 16 && str[10] === ' ') return str + ':00';
  return str;
}

exports.createAppointment = async ({ role, user_public_id, contact, assigned_to, status, date_time, created_by, counselor_id }) => {
  // Fetch the latest full_name from user_public
  const [userRows] = await db.query('SELECT full_name FROM user_public WHERE id = ?', [user_public_id]);
  const name_patient = userRows[0]?.full_name || '';

  const [result] = await db.query(
    'INSERT INTO appointments (role, name_patient, user_public_id, contact, assigned_to, counselor_id, status, date_time, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [role, name_patient, user_public_id, contact, assigned_to, counselor_id, status, date_time, created_by]
  );
  return result.insertId;
};

exports.getAppointments = async (filter = {}) => {
  let sql = `SELECT a.id, a.role, a.user_public_id, a.contact, a.assigned_to, a.counselor_id, a.created_by, a.status, 
             DATE_FORMAT(a.date_time, '%Y-%m-%d %H:%i:%s') as date_time, a.created_at,
             u.full_name as name_patient, u.email as patient_email, u.phone_number as patient_phone
             FROM appointments a
             LEFT JOIN user_public u ON a.user_public_id = u.id`;
  const params = [];
  const conditions = [];
  
  if (filter.id) {
    conditions.push("a.id = ?");
    params.push(filter.id);
  }
  if (filter.role) {
    conditions.push("a.role = ?");
    params.push(filter.role);
  }
  if (filter.user_public_id) {
    conditions.push("a.user_public_id = ?");
    params.push(filter.user_public_id);
  }
  if (filter.counselor_id) {
    conditions.push("a.counselor_id = ?");
    params.push(filter.counselor_id);
  }
  if (filter.assigned_to || filter.assigned_to_fullname || filter.created_by) {
    conditions.push("(a.assigned_to = ? OR a.assigned_to = ? OR a.created_by = ?)");
    params.push(filter.assigned_to, filter.assigned_to_fullname, filter.created_by);
  } else {
    if (filter.created_by) {
      conditions.push("a.created_by = ?");
      params.push(filter.created_by);
    }
    if (filter.assigned_to) {
      conditions.push("a.assigned_to = ?");
      params.push(filter.assigned_to);
    }
  }
  
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  
  sql += " ORDER BY a.date_time DESC";
  
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.getAppointmentsByAssignee = async (assigned_to) => {
  const sql = `SELECT a.id, a.role, a.user_public_id, a.contact, a.assigned_to, a.status, 
               DATE_FORMAT(a.date_time, '%Y-%m-%d %H:%i:%s') as date_time, a.created_at, 
               u.full_name as name_patient, u.email as patient_email, u.phone_number as patient_phone
               FROM appointments a 
               LEFT JOIN user_public u ON a.user_public_id = u.id 
               WHERE a.assigned_to = ? ORDER BY a.date_time DESC`;
  const [rows] = await db.query(sql, [assigned_to]);
  return rows;
};

exports.getAppointmentsByUserId = async (user_public_id) => {
  const sql = `SELECT a.id, a.role, a.user_public_id, a.contact, a.assigned_to, a.status, 
               DATE_FORMAT(a.date_time, '%Y-%m-%d %H:%i:%s') as date_time, a.created_at, 
               u.full_name as name_patient, u.email as patient_email, u.phone_number as patient_phone
               FROM appointments a 
               LEFT JOIN user_public u ON a.user_public_id = u.id 
               WHERE a.user_public_id = ? 
                 AND a.date_time >= NOW()
                 AND a.status IN ('Accepted', 'In Progress')
               ORDER BY a.date_time ASC`;
  const [rows] = await db.query(sql, [user_public_id]);
  return rows;
};

exports.updateAppointment = async (id, { role, user_public_id, contact, assigned_to, status, date_time, created_by, counselor_id, name_patient }) => {
  // If name_patient, user_public_id, or counselor_id is not provided, fetch the current value
  let finalNamePatient = name_patient;
  let finalUserPublicId = user_public_id;
  let finalCounselorId = counselor_id;
  if (!finalNamePatient || !finalUserPublicId || !finalCounselorId) {
    const [rows] = await db.query('SELECT name_patient, user_public_id, counselor_id FROM appointments WHERE id = ?', [id]);
    if (rows.length > 0) {
      if (!finalNamePatient) finalNamePatient = rows[0].name_patient;
      if (!finalUserPublicId) finalUserPublicId = rows[0].user_public_id;
      if (!finalCounselorId) finalCounselorId = rows[0].counselor_id;
    }
  }
  // Fetch the latest full_name from user_public if user_public_id is provided
  if (finalUserPublicId) {
    const [userRows] = await db.query('SELECT full_name FROM user_public WHERE id = ?', [finalUserPublicId]);
    finalNamePatient = userRows[0]?.full_name || finalNamePatient;
  }
  // Fetch the current date_time from DB
  const [rows2] = await db.query('SELECT date_time FROM appointments WHERE id = ?', [id]);
  const currentDateTime = rows2[0]?.date_time;
  // Determine which date_time to use
  let mysqlDateTime = currentDateTime;
  if (date_time && toMySQLDatetime(date_time) !== currentDateTime) {
    mysqlDateTime = toMySQLDatetime(date_time);
  }
  const [result] = await db.query(
    'UPDATE appointments SET role=?, name_patient=?, user_public_id=?, contact=?, assigned_to=?, counselor_id=?, status=?, date_time=?, created_by=? WHERE id=?',
    [role, finalNamePatient, finalUserPublicId, contact, assigned_to, finalCounselorId, status, mysqlDateTime, created_by, id]
  );
  return result.affectedRows > 0;
};

exports.deleteAppointment = async (id) => {
  const [result] = await db.query('DELETE FROM appointments WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

exports.checkAppointmentConflict = async (counselor_id, date_time, excludeId = null) => {
  try {
    // Convert date_time to MySQL compatible format and extract date and hour
    const appointmentDate = new Date(date_time);
    const dateStr = appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const hour = appointmentDate.getHours();
    
    let sql = `SELECT id, date_time, assigned_to FROM appointments 
               WHERE counselor_id = ? 
               AND DATE(date_time) = ? 
               AND HOUR(date_time) = ?`;
    const params = [counselor_id, dateStr, hour];
    
    // If updating an existing appointment, exclude it from the conflict check
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    console.log('Checking appointment conflict:', {
      counselor_id,
      date_time,
      dateStr,
      hour,
      excludeId,
      sql,
      params
    });
    
    const [rows] = await db.query(sql, params);
    
    if (rows.length > 0) {
      console.log('Conflict found:', rows);
    } else {
      console.log('No conflict found');
    }
    
    return rows.length > 0; // Return true if conflict exists (any appointment in same hour)
  } catch (error) {
    console.error('Error in checkAppointmentConflict:', error);
    return false; // On error, allow the appointment to proceed
  }
};
