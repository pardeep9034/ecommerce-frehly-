// config/database.js (Root level or shared)
const mysql = require('mysql2/promise');
require('dotenv').config();


const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'veggie_ecommerce',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// For Railway or external databases
// if (process.env.RAILWAY_DB_URL) {
//   // Parse Railway URL: mysql://user:password@host:port/database
//   const url = new URL(process.env.RAILWAY_DB_URL);
//   dbConfig.host = url.hostname;
//   dbConfig.port = url.port;
//   dbConfig.user = url.username;
//   dbConfig.password = url.password;
//   dbConfig.database = url.pathname.slice(1); // Remove leading '/'
// }

const pool = mysql.createPool(dbConfig);


module.exports = {
  pool,
  dbConfig
};