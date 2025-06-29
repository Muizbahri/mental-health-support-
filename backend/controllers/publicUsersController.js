// Wrap database import in try-catch to prevent module loading errors
let db;
try {
  db = require('../config/db');
} catch (error) {
  console.error('Failed to load database in publicUsersController:', error);
  // Export error handlers
  exports.getAllPublicUsers = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.loginPublicUser = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  return;
}

const jwt = require('jsonwebtoken');

exports.getAllPublicUsers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM user_public");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch public users" });
  }
};

exports.loginPublicUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required.' 
      });
    }

    // Query user by email only (don't compare password in SQL for security)
    const [rows] = await db.query("SELECT * FROM user_public WHERE email = ?", [email]);
    
    // Check if user exists
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    const user = rows[0];
    
    // Compare password (assuming plain text for now - should be hashed in production)
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // Generate JWT token with fallback for JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: 'public' 
      }, 
      jwtSecret, 
      { expiresIn: '1d' }
    );

    // Remove password from user object before sending response
    delete user.password;

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      user,
      token 
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error' 
    });
  }
}; 