/**
 * ==========================================================================
 * ENTERPRISE MYSQL DATABASE CONFIGURATION & CONNECTION POOL
 * ==========================================================================
 */

let mysql = null;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  mysql = null;
}

let pool = null;
let isMySQLConnected = false;

const getMySQLConfig = () => {
  return {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'bookbridge',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    connectTimeout: 5000
  };
};

const connectMySQL = async () => {
  if (!mysql) {
    console.log('[MySQL Info] mysql2 package not installed. Skipping MySQL initialization.');
    return false;
  }

  const config = getMySQLConfig();

  try {
    pool = mysql.createPool(config);
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    isMySQLConnected = true;
    console.log(`[MySQL Connected] Successfully connected to database '${config.database}' on ${config.host}:${config.port}`);
    return true;
  } catch (error) {
    console.log(`[MySQL Info] Could not connect to MySQL server (${error.message}).`);
    isMySQLConnected = false;
    return false;
  }
};

const getMySQLPool = () => pool;
const getMySQLStatus = () => isMySQLConnected;

/**
 * Execute a MySQL query with automatic connection management
 */
const queryMySQL = async (sql, params = []) => {
  if (!pool || !isMySQLConnected) {
    throw new Error('MySQL database connection is not active.');
  }
  const [rows, fields] = await pool.execute(sql, params);
  return rows;
};

module.exports = {
  connectMySQL,
  getMySQLPool,
  getMySQLStatus,
  queryMySQL
};
