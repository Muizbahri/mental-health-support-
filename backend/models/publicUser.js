const db = require('../config/db');

exports.getAllPublicUsers = async () => {
  const [rows] = await db.query('SELECT * FROM user_public');
  return rows;
};

exports.getPublicUserById = async (id) => {
  const [rows] = await db.query('SELECT * FROM user_public WHERE id = ?', [id]);
  return rows[0];
};

exports.getPublicUserByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM user_public WHERE email = ?', [email]);
  return rows[0];
};

exports.createPublicUser = async (userData) => {
  try {
    const { full_name, email, ic_number, age, phone_number, profile_image, password } = userData;
    
    console.log("Model: Creating public user with data:", {
      full_name,
      email,
      ic_number,
      age: age || null,
      phone_number,
      has_profile_image: !!profile_image,
      has_password: !!password
    });
    
    const [result] = await db.query(
      'INSERT INTO user_public (full_name, email, ic_number, age, phone_number, profile_image, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [full_name, email, ic_number, age || null, phone_number, profile_image || null, password]
    );
    
    console.log("Model: Insert result:", {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    });
    
    return result.insertId;
  } catch (error) {
    console.error("Model error creating public user:", error);
    throw error;
  }
};

exports.updatePublicUser = async (id, userData) => {
  try {
    const { full_name, email, ic_number, age, phone_number, profile_image, password } = userData;
    
    console.log("Model: Updating public user with data:", {
      id,
      full_name,
      email,
      ic_number,
      age: age || null,
      phone_number,
      has_profile_image: !!profile_image,
      password_changed: password !== undefined && password !== null && password !== ''
    });
    
    // Build the SQL query dynamically based on whether password is included
    let sql = 'UPDATE user_public SET ';
    const updateFields = [];
    const params = [];
    
    // Add standard fields
    updateFields.push('full_name=?');
    params.push(full_name);
    
    updateFields.push('email=?');
    params.push(email);
    
    updateFields.push('ic_number=?');
    params.push(ic_number);
    
    updateFields.push('age=?');
    params.push(age || null);
    
    updateFields.push('phone_number=?');
    params.push(phone_number);
    
    if (profile_image !== undefined) {
      updateFields.push('profile_image=?');
      params.push(profile_image);
    }
    
    // Only include password if it's not empty
    if (password !== undefined && password !== null && password !== '') {
      updateFields.push('password=?');
      params.push(password);
      console.log("Model: Including password in update");
    } else {
      console.log("Model: Excluding password from update");
    }
    
    // Complete the SQL query
    sql += updateFields.join(', ') + ' WHERE id=?';
    params.push(id);
    
    console.log("Model: Final SQL (without values):", sql);
    
    const [result] = await db.query(sql, params);
    
    console.log("Model: Update result:", {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    });
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Model error updating public user:", error);
    throw error;
  }
};

exports.deletePublicUser = async (id) => {
  const [result] = await db.query('DELETE FROM user_public WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

exports.updateProfileImage = async (id, profileImage) => {
  const [result] = await db.query('UPDATE user_public SET profile_image = ? WHERE id = ?', [profileImage, id]);
  return result.affectedRows > 0;
}; 