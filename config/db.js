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
const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.TIDB_DATABASE_URL;

if (databaseUrl) {
  // MySQL / TiDB Cloud / Postgres Connection String
  const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
  const isTiDB = databaseUrl.includes('tidbcloud.com') || process.env.TIDB_ENABLE_SSL === 'true';
  const requireSSL = isPostgres || isTiDB || process.env.MYSQL_SSL === 'true' || process.env.DB_SSL === 'true' || databaseUrl.includes('ssl=');

  dbDialect = isPostgres ? 'postgres' : 'mysql';

  const dialectOptions = isPostgres ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : (requireSSL ? {
    connectTimeout: 30000,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  } : {
    connectTimeout: 20000
  });

  sequelize = new Sequelize(databaseUrl, {
    dialect: dbDialect,
    dialectOptions,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 15,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  console.log(`[DB Config] Configured ${isTiDB ? 'TiDB Cloud (MySQL SSL)' : dbDialect.toUpperCase()} connection from DATABASE_URL.`);
} else if (process.env.MYSQL_HOST) {
  // Explicit MySQL / TiDB Environment Variables
  const host = process.env.MYSQL_HOST;
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const database = process.env.MYSQL_DATABASE || 'bookbridge';
  const username = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const isTiDB = host.includes('tidbcloud.com') || port === 4000 || process.env.TIDB_ENABLE_SSL === 'true';
  const requireSSL = isTiDB || process.env.MYSQL_SSL === 'true';
  dbDialect = 'mysql';

  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'mysql',
    dialectOptions: requireSSL ? {
      connectTimeout: 30000,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    } : {
      connectTimeout: 20000
    },
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 15,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  console.log(`[DB Config] Configured ${isTiDB ? 'TiDB Cloud' : 'MySQL'} connection at ${host}:${port}/${database}.`);
} else {
  // Resilient Zero-Config Mode using SQLite
  // Never crashes the container on Render even if external DB credentials are not yet supplied!
  const dbDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  const sqlitePath = path.join(dbDir, 'bookbridge.sqlite');
  dbDialect = 'sqlite';

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  });
  console.warn('[DB Resilience] Neither DATABASE_URL nor MYSQL_HOST provided in environment.');
  console.warn(`[DB Resilience] Initializing resilient SQLite database at: ${sqlitePath}`);
  console.warn('[DB Resilience] To connect TiDB Cloud, add DATABASE_URL into your Render environment variables.');
}

/**
 * Connect to database and verify connectivity
 */
const connectDB = async () => {
  if (!sequelize) {
    console.warn('[DB Warning] Database connection instance not initialized.');
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

    // Automatic Failover: if cloud DB connection fails (e.g. invalid password or network timeout),
    // fall back to local SQLite so the server stays ALIVE and serves the website and API.
    if (dbDialect !== 'sqlite') {
      console.warn(`[DB Failover] Falling back to local SQLite engine to keep server alive and healthy.`);
      try {
        const dbDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
        const sqlitePath = path.join(dbDir, 'bookbridge.sqlite');
        dbDialect = 'sqlite';
        sequelize = new Sequelize({
          dialect: 'sqlite',
          storage: sqlitePath,
          logging: false
        });
        await sequelize.authenticate();
        isConnected = true;
        console.log(`[Database Connected] Resilient SQLite fallback engine active.`);
        return true;
      } catch (fallbackError) {
        console.error(`[DB Fatal] Fallback failed:`, fallbackError.message);
      }
    }

    console.warn(`[DB Notice] Server will continue running so health checks and static files succeed.`);
    return false;
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
