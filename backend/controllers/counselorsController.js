let db;
let counselorsModel;
try {
  db = require('../config/db');
  counselorsModel = require('../models/counselors');
} catch (error) {
  console.error('Failed to load database or model in counselorsController:', error);
  // Export error handlers
  exports.getCounselors = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.getCounselorById = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.createCounselor = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.updateCounselor = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.deleteCounselor = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.loginCounselor = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  return;
}

const jwt = require('jsonwebtoken');

exports.getCounselors = async (req, res) => {
  try {
    // Initialize counselors as an empty array
    let counselors = [];
    
    try {
      // Attempt to fetch counselors from the database
      counselors = await counselorsModel.getAllCounselors();
    } catch (dbError) {
      console.error('Database error fetching counselors:', dbError);
      // Don't throw, just log and continue with empty array
    }
    
    // Ensure counselors is always an array
    counselors = Array.isArray(counselors) ? counselors : [];
    
    // Log information about the counselors being returned
    console.log(`Returning ${counselors.length} counselors to frontend`);
    
    // Log how many counselors have registration_number and certificate
    const registeredCounselors = counselors.filter(c => c && c.registration_number && c.certificate);
    console.log(`${registeredCounselors.length} counselors have both registration_number and certificate`);
    
    // Always return a valid response with success and data properties
    return res.json({ 
      success: true, 
      data: counselors 
    });
  } catch (error) {
    console.error('Error fetching counselors:', error);
    // Even in case of error, return a valid response format
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching counselors',
      message: error.message || 'Unknown error',
      data: [] 
    });
  }
};

exports.getCounselorById = async (req, res) => {
  try {
    const { id } = req.params;
    const counselor = await counselorsModel.getCounselorById(id);
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }
    delete counselor.password;
    res.json({ success: true, data: counselor });
  } catch (err) {
    console.error('Error fetching counselor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createCounselor = async (req, res) => {
  try {
    const { full_name, email, ic_number, age, phone_number, registration_number, location, address, latitude, longitude, password } = req.body;
    const certificate = req.files['certificate'] ? req.files['certificate'][0].filename : null;
    const profile_image = req.files['profile_image'] ? req.files['profile_image'][0].filename : null;

    // Check for existing counselor
    const existingCounselor = await counselorsModel.getCounselorByEmail(email);
    if (existingCounselor) {
      return res.status(409).json({ success: false, message: 'Counselor with this email already exists.' });
    }

    const counselorData = {
      full_name, email, ic_number, age, phone_number, registration_number,
      certificate, profile_image, location, address, latitude, longitude, password
    };
    
    const counselorId = await counselorsModel.createCounselor(counselorData);
    res.status(201).json({ success: true, message: 'Counselor created successfully', id: counselorId });
  } catch (err) {
    console.error("Error creating counselor:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateCounselor = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, ic_number, age, phone_number, registration_number, location, address, latitude, longitude, password } = req.body;
    let certificate = req.files['certificate'] ? req.files['certificate'][0].filename : null;
    let profile_image = req.files['profile_image'] ? req.files['profile_image'][0].filename : null;

    // If no new files, keep the old ones
      const counselor = await counselorsModel.getCounselorById(id);
      if (!counselor) {
        return res.status(404).json({ success: false, message: 'Counselor not found' });
      }
      if (!certificate) certificate = counselor.certificate;
      if (!profile_image) profile_image = counselor.profile_image;

    // Only update password if a new value is provided (not empty/null/undefined)
    let newPassword = counselor.password;
    if (typeof password === 'string' && password.trim() !== '' && password !== counselor.password) {
      newPassword = password;
    }

    const counselorData = {
      full_name, email, ic_number, age, phone_number, registration_number,
      certificate, profile_image, location, address, latitude, longitude, password: newPassword
    };
    
    const success = await counselorsModel.updateCounselor(id, counselorData);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }
    
    res.json({ success: true, message: 'Counselor updated successfully' });
  } catch (err) {
    console.error('Error updating counselor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteCounselor = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await counselorsModel.deleteCounselor(id);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }
    
    res.json({ success: true, message: 'Counselor deleted successfully' });
  } catch (err) {
    console.error('Error deleting counselor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.loginCounselor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    
    const counselor = await counselorsModel.getCounselorByEmail(email);
    if (!counselor) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    
    // Plaintext password comparison (for demo/dev only)
    if (counselor.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        id: counselor.id, 
        email: counselor.email, 
        full_name: counselor.full_name,
        role: 'counselor' 
      },
      jwtSecret,
      { expiresIn: '1d' }
    );
    
    delete counselor.password;
    res.json({ success: true, message: 'Login successful', user: counselor, token });
  } catch (err) {
    console.error('Counselor login error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.listRegisteredCounselors = async (req, res) => {
  try {
    const counselors = await counselorsModel.getRegisteredCounselors();
    console.log(`Returning ${counselors.length} registered counselors with full data to frontend`);
    
    // Always return a valid response with success and data properties
    return res.json({ 
      success: true, 
      data: counselors 
    });
  } catch (error) {
    console.error('Error fetching registered counselors:', error);
    // Even in case of error, return a valid response format
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching registered counselors',
      message: error.message || 'Unknown error',
      data: [] 
    });
  }
}; 