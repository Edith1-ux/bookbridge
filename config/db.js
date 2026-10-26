/**
 * ==========================================================================
 * BOOKBRIDGE AUTHORITATIVE DATABASE ENGINE (Sequelize ORM + MySQL)
 * Production-ready connection pooling, strict error isolation, and migrations
 * ==========================================================================
 */

const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

let sequelize = null;
let isConnected = false;
let dbDialect = 'mysql';

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (databaseUrl) {
  // MySQL / Postgres Connection String (e.g. Render MySQL or external cloud DB)
  const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
  dbDialect = isPostgres ? 'postgres' : 'mysql';

  sequelize = new Sequelize(databaseUrl, {
    dialect: dbDialect,
    dialectOptions: isPostgres ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {
      connectTimeout: 20000
    },
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (process.env.MYSQL_HOST) {
  // Explicit MySQL Environment Variables
  const host = process.env.MYSQL_HOST;
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const database = process.env.MYSQL_DATABASE || 'bookbridge';
  const username = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  dbDialect = 'mysql';

  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (!isProduction) {
  // Local Development SQL Mode using SQLite (Relational SQL with full table constraints)
  const dbDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  const sqlitePath = path.join(dbDir, 'bookbridge.sqlite');
  dbDialect = 'sqlite';

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  });
  console.log(`[DB Config] Using local SQLite development database at: ${sqlitePath}`);
} else {
  // In production, database credentials are REQUIRED
  console.error('[DB FATAL] DATABASE_URL or MYSQL_HOST environment variable is missing in production!');
}

/**
 * Connect to database and verify connectivity
 */
const connectDB = async () => {
  if (!sequelize) {
    const errorMsg = 'Database connection instance not initialized. Missing DATABASE_URL or MYSQL_HOST in production.';
    console.error(`[DB Error] ${errorMsg}`);
    if (isProduction) {
      throw new Error(errorMsg);
    }
    return false;
  }

  try {
    await sequelize.authenticate();
    isConnected = true;
    console.log(`[Database Connected] Successfully connected to ${dbDialect.toUpperCase()} database engine.`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error(`[Database Error] Connection failed (${error.message}).`);

    if (isProduction) {
      // In production, do NOT silently fall back. Throw error to let the orchestrator handle it.
      throw new Error(`Production Database Error: ${error.message}`);
    } else {
      console.warn(`[DB Notice] Operating in local fallback mode. Data will be saved locally.`);
      return false;
    }
  }
};

const getSQLStatus = () => isConnected;
const getMongoStatus = () => isConnected; // Compatibility alias

module.exports = {
  sequelize,
  connectDB,
  getSQLStatus,
  getMongoStatus,
  getDialect: () => dbDialect
};
