const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const verified = jwt.verify(token, jwtSecret);
    req.user = verified;
    next();
  } catch (err) {
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