// Wrap database import in try-catch to prevent module loading errors
let db;
let publicUserModel;
try {
  db = require('../config/db');
  publicUserModel = require('../models/publicUser');
} catch (error) {
  console.error('Failed to load database or model in publicUsersController:', error);
  // Export error handlers
  exports.getAllPublicUsers = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.getPublicUserById = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.createPublicUser = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.updatePublicUser = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.deletePublicUser = async (req, res) => {
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
    const users = await publicUserModel.getAllPublicUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching public users:', err);
    res.status(500).json({ success: false, error: "Failed to fetch public users" });
  }
};

exports.getPublicUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await publicUserModel.getPublicUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    delete user.password;
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error fetching public user:', err);
    res.status(500).json({ success: false, error: "Failed to fetch public user" });
  }
};

exports.createPublicUser = async (req, res) => {
  try {
    console.log("Create public user request body:", req.body);
    console.log("Create public user request file:", req.file);
    
    const { full_name, email, ic_number, phone_number, password } = req.body;
    const profile_image = req.file?.filename;
    
    if (!full_name || !email || !ic_number || !phone_number || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields',
        missing: {
          full_name: !full_name,
          email: !email,
          ic_number: !ic_number,
          phone_number: !phone_number,
          password: !password
        }
      });
    }

    // Calculate age from IC number
    function calculateAgeFromIC(ic) {
      const match = ic.match(/^(\d{2})(\d{2})(\d{2})/);
      if (!match) return null;
      let [_, yy, mm, dd] = match;
      yy = parseInt(yy, 10);
      mm = parseInt(mm, 10);
      dd = parseInt(dd, 10);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const century = yy > currentYear ? 1900 : 2000;
      const birthYear = century + yy;
      const birthDate = new Date(birthYear, mm - 1, dd);
      if (isNaN(birthDate.getTime())) return null;
      let age = now.getFullYear() - birthYear;
      const m = now.getMonth() - (mm - 1);
      if (m < 0 || (m === 0 && now.getDate() < dd)) {
        age--;
      }
      return age >= 0 && age < 150 ? age : null;
    }
    
    const age = calculateAgeFromIC(ic_number);
    console.log(`Calculated age ${age} from IC number ${ic_number}`);

    // Check for existing user
    const existingUser = await publicUserModel.getPublicUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const userData = { full_name, email, ic_number, age, phone_number, profile_image, password };
    console.log("Creating user with data:", { ...userData, password: '***' });
    
    const userId = await publicUserModel.createPublicUser(userData);
    console.log(`User created successfully with ID ${userId}`);
    
    res.status(201).json({ success: true, message: 'User created successfully', id: userId });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error while creating user', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.updatePublicUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, ic_number, age, phone_number, password } = req.body;
    let profile_image = req.file?.filename;

    // If no new file, keep the old one
    if (!profile_image) {
      const user = await publicUserModel.getPublicUserById(id);
      profile_image = user?.profile_image || null;
    }

    const userData = { full_name, email, ic_number, age, phone_number, profile_image, password };
    const success = await publicUserModel.updatePublicUser(id, userData);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

exports.deletePublicUser = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await publicUserModel.deletePublicUser(id);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};

exports.loginPublicUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[LOGIN] Received request for email:', email);
    
    if (!email || !password) {
      console.log('[LOGIN] Missing email or password');
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required.' 
      });
    }
    
    // Query user by email
    console.log('[LOGIN] Querying database for user with email:', email);
    const user = await publicUserModel.getPublicUserByEmail(email);
    
    if (!user) {
      console.log('[LOGIN] User not found for email:', email);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found with this email.' 
      });
    }
    
    console.log('[LOGIN] User found:', { id: user.id, email: user.email });
    
    // Plaintext password comparison (for demo/dev only)
    if (user.password !== password) {
      console.log('[LOGIN] Password mismatch for user:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'public' },
      jwtSecret,
      { expiresIn: '1d' }
    );
    
    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;
    
    console.log('[LOGIN] Success for user:', email);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token
    });
  } catch (err) {
    console.error('[LOGIN ERROR]:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}; 