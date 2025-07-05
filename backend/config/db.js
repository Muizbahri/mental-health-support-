require('dotenv').config();
const mysql = require('mysql2');

// Use a connection pool instead of a single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'mental_health',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export a promise-based pool
const dbPromise = pool.promise();

module.exports = dbPromise; 