const db = require('../config/db');

exports.createAppointment = async ({ role, name_patient, contact, assigned_to, status, date_time, created_by, counselor_id }) => {
  const [result] = await db.query(
    'INSERT INTO appointments (role, name_patient, contact, assigned_to, counselor_id, status, date_time, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [role, name_patient, contact, assigned_to, counselor_id, status, date_time, created_by]
  );
  return result.insertId;
};

exports.getAppointments = async (filter = {}) => {
  let sql = "SELECT id, role, name_patient, contact, assigned_to, counselor_id, created_by, status, DATE_FORMAT(date_time, '%Y-%m-%d %H:%i:%s') as date_time, created_at FROM appointments";
  const params = [];
  const conditions = [];
  if (filter.id) {
    conditions.push("id = ?");
    params.push(filter.id);
  }
  if (filter.role) {
    conditions.push("role = ?");
    params.push(filter.role);
  }
  if (filter.user) {
    conditions.push("name_patient = ?");
    params.push(filter.user);
  }
  if (filter.counselor_id) {
    conditions.push("counselor_id = ?");
    params.push(filter.counselor_id);
  }
  if (filter.assigned_to || filter.assigned_to_fullname || filter.created_by) {
    conditions.push("(assigned_to = ? OR assigned_to = ? OR created_by = ?)");
    params.push(filter.assigned_to, filter.assigned_to_fullname, filter.created_by);
  } else {
    if (filter.created_by) {
      conditions.push("created_by = ?");
      params.push(filter.created_by);
    }
    if (filter.assigned_to) {
      conditions.push("assigned_to = ?");
      params.push(filter.assigned_to);
    }
  }
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.getAppointmentsByAssignee = async (assigned_to) => {
  const sql = `SELECT a.id, a.role, a.name_patient, a.contact, a.assigned_to, a.status, DATE_FORMAT(a.date_time, '%Y-%m-%d %H:%i:%s') as date_time, a.created_at, u.email as patient_email FROM appointments a LEFT JOIN user_public u ON a.name_patient = u.full_name WHERE a.assigned_to = ? ORDER BY a.date_time DESC`;
  const [rows] = await db.query(sql, [assigned_to]);
  return rows;
};

exports.updateAppointment = async (id, { role, name_patient, contact, assigned_to, status, date_time, created_by }) => {
  const [result] = await db.query(
    'UPDATE appointments SET role=?, name_patient=?, contact=?, assigned_to=?, status=?, date_time=?, created_by=? WHERE id=?',
    [role, name_patient, contact, assigned_to, status, date_time, created_by, id]
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
