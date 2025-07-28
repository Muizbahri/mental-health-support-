const db = require('./db');

exports.getReferralRequests = async (filter = {}) => {
  let sql = 'SELECT id, patient_name, referred_by, disorder, status, created_at, psychiatrist_id, counselor_id FROM referral_requests';
  const params = [];
  const conditions = [];
  if (filter.id) {
    conditions.push('id = ?');
    params.push(filter.id);
  }
  if (filter.psychiatrist_id) {
    conditions.push('psychiatrist_id = ?');
    params.push(filter.psychiatrist_id);
  }
  if (filter.counselor_id) {
    conditions.push('counselor_id = ?');
    params.push(filter.counselor_id);
  }
  if (filter.status) {
    conditions.push('status = ?');
    params.push(filter.status);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY created_at DESC';
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.createReferralRequest = async ({ patient_name, referred_by, disorder, status, psychiatrist_id, counselor_id }) => {
  const sql = 'INSERT INTO referral_requests (patient_name, referred_by, disorder, status, psychiatrist_id, counselor_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())';
  const [result] = await db.query(sql, [patient_name, referred_by, disorder, status, psychiatrist_id, counselor_id]);
  return result.insertId;
};

exports.updateReferralRequest = async (id, data) => {
  // Update all editable fields if provided
  if (data.patient_name && data.referred_by && data.disorder && data.status && data.psychiatrist_id) {
    const sql = 'UPDATE referral_requests SET patient_name=?, referred_by=?, disorder=?, status=?, psychiatrist_id=? WHERE id=?';
    const [result] = await db.query(sql, [data.patient_name, data.referred_by, data.disorder, data.status, data.psychiatrist_id, id]);
    return result.affectedRows > 0;
  }
  // Fallback: update only status if that's all that's provided
  if (data.status) {
    const sql = 'UPDATE referral_requests SET status=? WHERE id=?';
    const [result] = await db.query(sql, [data.status, id]);
    return result.affectedRows > 0;
  }
  return false;
};

exports.deleteReferralRequest = async (id) => {
  const [result] = await db.query('DELETE FROM referral_requests WHERE id=?', [id]);
  return result.affectedRows > 0;
}; 