const db = require('../models/db');
const jwt = require('jsonwebtoken');

exports.getAllPublicUsers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM user_public");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch public users" });
  }
};

exports.login = async (req, res) => {
  try {
    const email = (req.body.email || "").trim();
    const password = (req.body.password || "").trim();
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const [rows] = await db.query(
      'SELECT * FROM user_public WHERE email = ? AND password = ? LIMIT 1',
      [email, password]
    );
    console.log('Login attempt:', { email, password, rows });
    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: 'public' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    delete user.password;
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Public login error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}; 