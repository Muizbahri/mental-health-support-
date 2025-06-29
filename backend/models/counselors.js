const db = require('../config/db');

exports.getAllCounselors = async () => {
  const [rows] = await db.query('SELECT * FROM counselors');
  return rows;
}; 