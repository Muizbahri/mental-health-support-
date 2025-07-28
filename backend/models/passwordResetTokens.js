const db = require('../config/db');

// Create password reset tokens table if it doesn't exist
const createTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        user_type ENUM('public', 'counselor', 'psychiatrist') NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_token (token),
        INDEX idx_expires (expires_at)
      )
    `);
    console.log('Password reset tokens table ready');
  } catch (error) {
    console.error('Error creating password reset tokens table:', error);
  }
};

// Initialize table
createTable();

exports.createResetToken = async (email, token, userType, expiresAt) => {
  try {
    // Clean up expired tokens first
    await db.query('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
    
    // Remove any existing tokens for this email
    await db.query('DELETE FROM password_reset_tokens WHERE email = ? AND user_type = ?', [email, userType]);
    
    // Insert new token
    const [result] = await db.query(
      'INSERT INTO password_reset_tokens (email, token, user_type, expires_at) VALUES (?, ?, ?, ?)',
      [email, token, userType, expiresAt]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error creating reset token:', error);
    throw error;
  }
};

exports.getResetToken = async (token) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = FALSE',
      [token]
    );
    return rows[0];
  } catch (error) {
    console.error('Error getting reset token:', error);
    throw error;
  }
};

exports.markTokenAsUsed = async (token) => {
  try {
    const [result] = await db.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
      [token]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error marking token as used:', error);
    throw error;
  }
};

exports.cleanupExpiredTokens = async () => {
  try {
    const [result] = await db.query('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
    console.log(`Cleaned up ${result.affectedRows} expired tokens`);
    return result.affectedRows;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};

// Clean up expired tokens every hour
setInterval(() => {
  exports.cleanupExpiredTokens().catch(console.error);
}, 60 * 60 * 1000); // 1 hour 