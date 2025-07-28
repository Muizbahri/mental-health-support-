let db;
let psychiatristsModel;
try {
  db = require('../config/db');
  psychiatristsModel = require('../models/psychiatrists');
} catch (error) {
  console.error('Failed to load database or model in psychiatristsController:', error);
  // Export error handlers
  exports.getPsychiatrists = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.getPsychiatristById = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.createPsychiatrist = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.updatePsychiatrist = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.deletePsychiatrist = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  exports.loginPsychiatrist = async (req, res) => {
    res.status(500).json({ success: false, error: 'Database connection error' });
  };
  return;
}

const jwt = require('jsonwebtoken');

exports.getPsychiatrists = async (req, res) => {
  try {
    // Initialize psychiatrists as an empty array
    let psychiatrists = [];
    
    try {
      // Attempt to fetch psychiatrists from the database
      psychiatrists = await psychiatristsModel.getAllPsychiatrists();
    } catch (dbError) {
      console.error('Database error fetching psychiatrists:', dbError);
      // Don't throw, just log and continue with empty array
    }
    
    // Ensure psychiatrists is always an array
    psychiatrists = Array.isArray(psychiatrists) ? psychiatrists : [];
    
    // Log information about the psychiatrists being returned
    console.log(`Returning ${psychiatrists.length} psychiatrists to frontend`);
    
    // Log how many psychiatrists have med_number and certificate
    const registeredPsychiatrists = psychiatrists.filter(p => p && p.med_number && p.certificate);
    console.log(`${registeredPsychiatrists.length} psychiatrists have both med_number and certificate`);
    
    // Always return a valid response with success and data properties
    return res.json({ 
      success: true, 
      data: psychiatrists 
    });
  } catch (error) {
    console.error('Error fetching psychiatrists:', error);
    // Even in case of error, return a valid response format
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching psychiatrists',
      message: error.message || 'Unknown error',
      data: [] 
    });
  }
};

exports.getPsychiatristById = async (req, res) => {
  try {
    const { id } = req.params;
    const psychiatrist = await psychiatristsModel.getPsychiatristById(id);
    if (!psychiatrist) {
      return res.status(404).json({ success: false, message: 'Psychiatrist not found' });
    }
    delete psychiatrist.password;
    res.json({ success: true, data: psychiatrist });
  } catch (err) {
    console.error('Error fetching psychiatrist:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createPsychiatrist = async (req, res) => {
  try {
    const { full_name, email, ic_number, age, phone_number, med_number, location, address, latitude, longitude, password } = req.body;
    const certificate = req.files['certificate'] ? req.files['certificate'][0].filename : null;
    const profile_image = req.files['profile_image'] ? req.files['profile_image'][0].filename : null;

    // Check for existing psychiatrist
    const existingPsychiatrist = await psychiatristsModel.getPsychiatristByEmail(email);
    if (existingPsychiatrist) {
      return res.status(409).json({ success: false, message: 'Psychiatrist with this email already exists.' });
    }

    const psychiatristData = {
      full_name, email, ic_number, age, phone_number, med_number,
      certificate, profile_image, location, address, latitude, longitude, password
    };
    
    const psychiatristId = await psychiatristsModel.createPsychiatrist(psychiatristData);
    res.status(201).json({ success: true, message: 'Psychiatrist created successfully', id: psychiatristId });
  } catch (err) {
    console.error("Error creating psychiatrist:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updatePsychiatrist = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, ic_number, age, phone_number, med_number, location, address, latitude, longitude, password } = req.body;
    let certificate = req.files['certificate'] ? req.files['certificate'][0].filename : null;
    let profile_image = req.files['profile_image'] ? req.files['profile_image'][0].filename : null;

    // If no new files, keep the old ones
    if (!certificate || !profile_image) {
      const psychiatrist = await psychiatristsModel.getPsychiatristById(id);
      if (!psychiatrist) {
        return res.status(404).json({ success: false, message: 'Psychiatrist not found' });
      }
      if (!certificate) certificate = psychiatrist.certificate;
      if (!profile_image) profile_image = psychiatrist.profile_image;
    }

    const psychiatristData = {
      full_name, email, ic_number, age, phone_number, med_number,
      certificate, profile_image, location, address, latitude, longitude, password
    };
    
    const success = await psychiatristsModel.updatePsychiatrist(id, psychiatristData);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Psychiatrist not found' });
    }
    
    res.json({ success: true, message: 'Psychiatrist updated successfully' });
  } catch (err) {
    console.error('Error updating psychiatrist:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deletePsychiatrist = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await psychiatristsModel.deletePsychiatrist(id);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Psychiatrist not found' });
    }
    
    res.json({ success: true, message: 'Psychiatrist deleted successfully' });
  } catch (err) {
    console.error('Error deleting psychiatrist:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.loginPsychiatrist = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    
    const psychiatrist = await psychiatristsModel.getPsychiatristByEmail(email);
    if (!psychiatrist) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    
    // Plaintext password comparison (for demo/dev only)
    if (psychiatrist.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { id: psychiatrist.id, email: psychiatrist.email, role: 'psychiatrist' },
      jwtSecret,
      { expiresIn: '1d' }
    );
    
    delete psychiatrist.password;
    res.json({ success: true, message: 'Login successful', user: psychiatrist, token });
  } catch (err) {
    console.error('Psychiatrist login error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.listRegisteredPsychiatrists = async (req, res) => {
  try {
    const psychiatrists = await psychiatristsModel.getRegisteredPsychiatrists();
    console.log(`Returning ${psychiatrists.length} registered psychiatrists with full data to frontend`);
    
    // Always return a valid response with success and data properties
    return res.json({ 
      success: true, 
      data: psychiatrists 
    });
  } catch (error) {
    console.error('Error fetching registered psychiatrists:', error);
    // Even in case of error, return a valid response format
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching registered psychiatrists',
      message: error.message || 'Unknown error',
      data: [] 
    });
  }
}; 