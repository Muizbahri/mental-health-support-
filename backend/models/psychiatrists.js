const db = require('../config/db');

exports.getAllPsychiatrists = async () => {
  try {
    // Explicitly select all fields to ensure none are missing
    const [rows] = await db.query(`
      SELECT 
        id, full_name, email, ic_number, age, phone_number, 
        med_number, certificate, profile_image, 
        location, address, latitude, longitude, 
        created_at
      FROM psychiatrists
    `);
    
    // Ensure rows is always an array
    const psychiatrists = Array.isArray(rows) ? rows : [];
    
    console.log(`Found ${psychiatrists.length} psychiatrists in database`);
    
    // Log if any psychiatrists are missing critical fields
    const missingFields = psychiatrists.filter(row => !row.med_number || !row.certificate);
    if (missingFields.length > 0) {
      console.log(`Warning: ${missingFields.length} psychiatrists are missing med_number or certificate`);
    }
    
    return psychiatrists;
  } catch (error) {
    console.error('Database error in getAllPsychiatrists:', error);
    // Return empty array instead of throwing
    return [];
  }
};

exports.getPsychiatristById = async (id) => {
  const [rows] = await db.query('SELECT * FROM psychiatrists WHERE id = ?', [id]);
  return rows[0];
};

exports.getPsychiatristByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM psychiatrists WHERE email = ?', [email]);
  return rows[0];
};

exports.getPsychiatristByFullName = async (full_name) => {
  const [rows] = await db.query('SELECT * FROM psychiatrists WHERE full_name = ?', [full_name]);
  return rows[0];
};

exports.createPsychiatrist = async (psychiatristData) => {
  const { 
    full_name, email, ic_number, age, phone_number, med_number, 
    certificate, profile_image, location, address, latitude, longitude, password 
  } = psychiatristData;
  
  const [result] = await db.query(
    'INSERT INTO psychiatrists (full_name, email, ic_number, age, phone_number, med_number, certificate, profile_image, location, address, latitude, longitude, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [full_name, email, ic_number, age, phone_number, med_number, certificate, profile_image, location, address, latitude, longitude, password]
  );
  return result.insertId;
};

exports.updatePsychiatrist = async (id, psychiatristData) => {
  const { 
    full_name, email, ic_number, age, phone_number, med_number, 
    certificate, profile_image, location, address, latitude, longitude, password 
  } = psychiatristData;
  
  const [result] = await db.query(
    'UPDATE psychiatrists SET full_name=?, email=?, ic_number=?, age=?, phone_number=?, med_number=?, certificate=?, profile_image=?, location=?, address=?, latitude=?, longitude=?, password=? WHERE id=?',
    [full_name, email, ic_number, age, phone_number, med_number, certificate, profile_image, location, address, latitude, longitude, password, id]
  );
  return result.affectedRows > 0;
};

exports.deletePsychiatrist = async (id) => {
  const [result] = await db.query('DELETE FROM psychiatrists WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

exports.updateProfileImage = async (id, profileImage) => {
  const [result] = await db.query('UPDATE psychiatrists SET profile_image = ? WHERE id = ?', [profileImage, id]);
  return result.affectedRows > 0;
};

exports.updateCertificate = async (id, certificate) => {
  const [result] = await db.query('UPDATE psychiatrists SET certificate = ? WHERE id = ?', [certificate, id]);
  return result.affectedRows > 0;
};

exports.getRegisteredPsychiatrists = async () => {
  try {
    // Select all psychiatrists with valid med_number and certificate
    // Return all necessary fields for dashboard display
    const [rows] = await db.query(`
      SELECT 
        id, full_name, email, ic_number, age, phone_number, 
        med_number, certificate, profile_image, 
        location, address, latitude, longitude, 
        created_at
      FROM psychiatrists
      WHERE med_number IS NOT NULL AND med_number != ''
        AND certificate IS NOT NULL AND certificate != ''
    `);
    
    console.log(`Found ${rows.length} registered psychiatrists in database`);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error('Database error in getRegisteredPsychiatrists:', error);
    return [];
  }
}; 