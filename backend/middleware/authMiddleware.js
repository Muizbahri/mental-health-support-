const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // First try to verify as JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    try {
      const verified = jwt.verify(token, jwtSecret);
      req.user = verified;
      return next();
    } catch (jwtErr) {
      // If JWT verification fails, check if it's an admin token (base64 encoded)
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        
        // Check if it's a valid admin token
        if (decoded.role === 'admin' && decoded.user === 'admin') {
          // Check if token hasn't expired
          if (decoded.exp && Date.now() < decoded.exp) {
            req.user = {
              id: decoded.id || 1,
              role: 'admin',
              user: 'admin'
            };
            console.log('Admin token authenticated successfully');
            return next();
          } else {
            return res.status(403).json({ message: 'Admin token expired' });
          }
        }
      } catch (adminTokenErr) {
        // Not a valid admin token either
      }
    }
    
    // If both JWT and admin token verification fail
    return res.status(403).json({ message: 'Invalid token' });
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(403).json({ message: 'Invalid token' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

exports.isCounselor = (req, res, next) => {
  if (!req.user || req.user.role !== 'counselor') {
    return res.status(403).json({ message: 'Access denied. Counselor privileges required.' });
  }
  next();
};

exports.isPsychiatrist = (req, res, next) => {
  if (!req.user || req.user.role !== 'psychiatrist') {
    return res.status(403).json({ message: 'Access denied. Psychiatrist privileges required.' });
  }
  next();
}; 