const db = require('./db');

exports.getAllActivities = async () => {
  const [rows] = await db.query('SELECT * FROM ngo_activities ORDER BY id DESC');
  return rows;
};

exports.createActivity = async (activity) => {
  const sql = `INSERT INTO ngo_activities (
    ngo_name, ngo_registration_number, contact_person_name, contact_email, 
    contact_phone, ngo_official_website, ngo_registration_proof, activity_title, 
    activity_date, activity_time, activity_location, address, activity_description, supporting_document
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    activity.ngo_name,
    activity.ngo_registration_number,
    activity.contact_person_name,
    activity.contact_email,
    activity.contact_phone,
    activity.ngo_official_website,
    activity.ngo_registration_proof,
    activity.activity_title,
    activity.activity_date,
    activity.activity_time,
    activity.activity_location,
    activity.address,
    activity.activity_description,
    activity.supporting_document
  ];
  const [result] = await db.query(sql, values);
  return result.insertId;
};

exports.updateActivity = async (id, activity) => {
  const fields = [
    'ngo_name', 'ngo_registration_number', 'contact_person_name', 'contact_email',
    'contact_phone', 'ngo_official_website', 'activity_title', 'activity_date',
    'activity_time', 'activity_location', 'address', 'activity_description'
  ];
  const updates = [];
  const values = [];
  fields.forEach(field => {
    if (activity[field] !== undefined && activity[field] !== null && activity[field] !== '') {
      updates.push(`${field} = ?`);
      values.push(activity[field]);
    }
  });
  if (activity.ngo_registration_proof) {
    updates.push('ngo_registration_proof = ?');
    values.push(activity.ngo_registration_proof);
  }
  if (activity.supporting_document) {
    updates.push('supporting_document = ?');
    values.push(activity.supporting_document);
  }
  if (updates.length === 0) return false;
  values.push(id);
  const sql = `UPDATE ngo_activities SET ${updates.join(', ')} WHERE id = ?`;
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
};

exports.deleteActivity = async (id) => {
  const [result] = await db.query('DELETE FROM ngo_activities WHERE id = ?', [id]);
  return result.affectedRows > 0;
}; 