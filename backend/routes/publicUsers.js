const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Wrap controller import in try-catch to prevent module loading errors
let publicUsersController;
try {
  publicUsersController = require('../controllers/publicUsersController');
} catch (error) {
  console.error('Failed to load publicUsersController:', error);
  // Export a router with error handlers
  router.use('*', (req, res) => {
    res.status(500).json({ success: false, message: 'Controller loading error' });
  });
  module.exports = router;
  return;
}

// Storage config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/');
    console.log(`Uploading file to: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    console.log(`Accepting file: ${file.originalname}, mimetype: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.log(`Rejecting file: ${file.originalname}, mimetype: ${file.mimetype}`);
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// GET all public users
router.get('/', publicUsersController.getAllPublicUsers);

// GET public user by ID
router.get('/:id', publicUsersController.getPublicUserById);

// POST create new public user
router.post('/', upload.single('profile_image'), (req, res, next) => {
  console.log('POST /api/public-users route hit');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
  // Call the controller
  publicUsersController.createPublicUser(req, res);
});

// PUT update public user
router.put('/:id', upload.single('profile_image'), publicUsersController.updatePublicUser);

// DELETE public user
router.delete('/:id', publicUsersController.deletePublicUser);

// POST login
router.post('/login', (req, res, next) => {
  console.log('POST /api/public-users/login route hit');
  console.log('Login request body:', { email: req.body.email, password: req.body.password ? '******' : undefined });
  
  // Call the controller
  publicUsersController.loginPublicUser(req, res);
});

// POST upload profile image (protected route)
router.post('/upload-profile-image', upload.single('profile_image'), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;
    const filename = req.file.filename;
    
    const publicUserModel = require('../models/publicUser');
    await publicUserModel.updateProfileImage(userId, filename);
    
    res.json({ success: true, filename });
  } catch (err) {
    console.error('Profile image upload error:', err);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// GET public user profile (protected route)
router.get('/profile/me', async (req, res) => {
  console.log('GET /api/public-users/profile/me route hit');
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No authorization header provided');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('Token received:', token ? 'Yes (truncated): ' + token.substring(0, 15) + '...' : 'No');
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Token decoded successfully:', { id: decoded.id, email: decoded.email });
    
    const userId = decoded.id;
    
    const publicUserModel = require('../models/publicUser');
    console.log('Fetching user with ID:', userId);
    const user = await publicUserModel.getPublicUserById(userId);
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('User found:', { id: user.id, email: user.email });
    
    // Remove sensitive data
    const userResponse = { ...user };
    delete userResponse.password;
    
    res.json({ success: true, data: userResponse });
  } catch (err) {
    console.error('Get profile error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT update public user profile (protected route)
router.put('/profile/me', async (req, res) => {
  console.log('PUT /api/public-users/profile/me route hit');
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No authorization header provided');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;
    console.log('Updating profile for user ID:', userId);
    
    // Extract data from request body
    const { full_name, email, ic_number, age, phone_number, password, currentPassword } = req.body;
    console.log('Update request body:', { 
      full_name,
      email,
      ic_number,
      age,
      phone_number,
      password_provided: password !== undefined && password !== null && password !== '',
      current_password_provided: currentPassword !== undefined && currentPassword !== null && currentPassword !== ''
    });
    
    // Get current user data
    const publicUserModel = require('../models/publicUser');
    const user = await publicUserModel.getPublicUserById(userId);
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // If password change is requested, verify current password
    if (password !== undefined && password !== null && password !== '') {
      console.log('Password change requested');
      
      if (!currentPassword) {
        console.log('Current password missing for password change');
        return res.status(400).json({ success: false, message: 'Current password is required to change password' });
      }
      
      // Verify current password
      if (user.password !== currentPassword) {
        console.log('Current password verification failed');
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      
      console.log('Password verification successful, will update password');
    } else {
      console.log('No password change requested');
    }
    
    // Prepare user data for update
    const userData = { 
      full_name, 
      email, 
      ic_number, 
      age, 
      phone_number,
      profile_image: user.profile_image
    };
    
    // Only include password if it's provided and not empty
    if (password !== undefined && password !== null && password !== '') {
      userData.password = password;
      console.log('Including password in update data');
    } else {
      console.log('Password not changed, keeping existing password');
    }
    
    // Update user in database
    const success = await publicUserModel.updatePublicUser(userId, userData);
    
    if (!success) {
      return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE public user account (protected route)
router.delete('/account/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;
    
    const publicUserModel = require('../models/publicUser');
    const success = await publicUserModel.deletePublicUser(userId);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router; 