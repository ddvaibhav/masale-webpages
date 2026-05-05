const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'masala_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Pool Connected Successfully');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL Pool Connection Failed:', err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing MySQL pool...');
  await pool.end();
  process.exit(0);
});

module.exports = pool.execute.bind(pool);
