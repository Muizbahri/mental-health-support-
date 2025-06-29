const db = require('../config/db');

exports.getAllPsychiatrists = async () => {
  const [rows] = await db.query('SELECT * FROM psychiatrists');
  return rows;
}; 