const db = require('../config/db');

exports.getAllCounselors = async () => {
  try {
    // Explicitly select all fields to ensure none are missing
    const [rows] = await db.query(`
      SELECT 
        id, full_name, email, ic_number, age, phone_number, 
        registration_number, certificate, profile_image, 
        location, address, latitude, longitude, 
        created_at
      FROM counselors
    `);
    
    // Ensure rows is always an array
    const counselors = Array.isArray(rows) ? rows : [];
    
    console.log(`Found ${counselors.length} counselors in database`);
    
    // Log if any counselors are missing critical fields
    const missingFields = counselors.filter(row => !row.registration_number || !row.certificate);
    if (missingFields.length > 0) {
      console.log(`Warning: ${missingFields.length} counselors are missing registration_number or certificate`);
    }
    
    return counselors;
  } catch (error) {
    console.error('Database error in getAllCounselors:', error);
    // Return empty array instead of throwing
    return [];
  }
};

exports.getCounselorById = async (id) => {
  const [rows] = await db.query('SELECT * FROM counselors WHERE id = ?', [id]);
  return rows[0];
};

exports.getCounselorByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM counselors WHERE email = ?', [email]);
  return rows[0];
};

exports.createCounselor = async (counselorData) => {
  const { 
    full_name, email, ic_number, age, phone_number, registration_number, 
    certificate, profile_image, location, address, latitude, longitude, password 
  } = counselorData;
  
  const [result] = await db.query(
    'INSERT INTO counselors (full_name, email, ic_number, age, phone_number, registration_number, certificate, profile_image, location, address, latitude, longitude, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [full_name, email, ic_number, age, phone_number, registration_number, certificate, profile_image, location, address, latitude, longitude, password]
  );
  return result.insertId;
};

exports.updateCounselor = async (id, counselorData) => {
  const { 
    full_name, email, ic_number, age, phone_number, registration_number, 
    certificate, profile_image, location, address, latitude, longitude, password 
  } = counselorData;
  
  const [result] = await db.query(
    'UPDATE counselors SET full_name=?, email=?, ic_number=?, age=?, phone_number=?, registration_number=?, certificate=?, profile_image=?, location=?, address=?, latitude=?, longitude=?, password=? WHERE id=?',
    [full_name, email, ic_number, age, phone_number, registration_number, certificate, profile_image, location, address, latitude, longitude, password, id]
  );
  return result.affectedRows > 0;
};

exports.deleteCounselor = async (id) => {
  const [result] = await db.query('DELETE FROM counselors WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

exports.updateProfileImage = async (id, profileImage) => {
  const [result] = await db.query('UPDATE counselors SET profile_image = ? WHERE id = ?', [profileImage, id]);
  return result.affectedRows > 0;
};

exports.updateCertificate = async (id, certificate) => {
  const [result] = await db.query('UPDATE counselors SET certificate = ? WHERE id = ?', [certificate, id]);
  return result.affectedRows > 0;
};

exports.getCounselorByFullName = async (full_name) => {
  const [rows] = await db.query('SELECT * FROM counselors WHERE full_name = ?', [full_name]);
  return rows[0];
};

exports.getRegisteredCounselors = async () => {
  try {
    // Select all counselors with valid registration_number and certificate
    // Return all necessary fields for dashboard display
    const [rows] = await db.query(`
      SELECT 
        id, full_name, email, ic_number, age, phone_number, 
        registration_number, certificate, profile_image, 
        location, address, latitude, longitude, 
        created_at
      FROM counselors
      WHERE registration_number IS NOT NULL AND registration_number != ''
        AND certificate IS NOT NULL AND certificate != ''
    `);
    
    console.log(`Found ${rows.length} registered counselors in database`);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error('Database error in getRegisteredCounselors:', error);
    return [];
  }
}; 