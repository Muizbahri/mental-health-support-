const db = require('./db');

exports.getAllPsychiatrists = async () => {
  const [rows] = await db.query('SELECT * FROM psychiatrists');
  return rows;
}; 