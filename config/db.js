/**
 * ==========================================================================
 * ENTERPRISE DATABASE CONFIGURATION (Supabase Postgres / MySQL / JSON Fallback)
 * ==========================================================================
 */

let Sequelize = null;
try {
  Sequelize = require('sequelize').Sequelize;
} catch (e) {
  Sequelize = null;
}

let sequelizeInstance = null;
let isSQLConnected = false;

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.MYSQL_URL;

if (Sequelize) {
  if (databaseUrl) {
    // Supabase / Railway Postgres or External DB URL
    const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
    sequelizeInstance = new Sequelize(databaseUrl, {
      dialect: isPostgres ? 'postgres' : 'mysql',
      dialectOptions: isPostgres ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {},
      logging: false,
      pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else {
    // Standard Environment Variables
    const host = process.env.MYSQL_HOST || '127.0.0.1';
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
    const database = process.env.MYSQL_DATABASE || 'bookbridge';
    const username = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';

    sequelizeInstance = new Sequelize(database, username, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  }
}

const connectDB = async () => {
  if (!sequelizeInstance) {
    console.log('[DB Info] Sequelize not initialized. Operating in high-performance JSON DB fallback mode.');
    return false;
  }

  try {
    await sequelizeInstance.authenticate();
    isSQLConnected = true;
    console.log(`[Database Connected] Successfully connected to database engine.`);
    return true;
  } catch (error) {
    console.log(`[DB Info] Database connection offline (${error.message}). Operating smoothly with JSON DB fallback engine.`);
    isSQLConnected = false;
    return false;
  }
};

const getSQLStatus = () => isSQLConnected;
const getMongoStatus = () => isSQLConnected; // Backward compatibility alias

module.exports = {
  connectDB,
  getSQLStatus,
  getMongoStatus,
  sequelize: sequelizeInstance
};
