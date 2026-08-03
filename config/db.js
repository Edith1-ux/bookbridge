/**
 * ==========================================================================
 * ENTERPRISE DATABASE CONFIGURATION (MySQL + MongoDB Mongoose + JSON Fallback)
 * ==========================================================================
 */

const { connectMySQL, getMySQLStatus, queryMySQL } = require('./mysql');

let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

let isMongoConnected = false;

const connectDB = async () => {
  // 1. Try connecting to MySQL Database
  const mysqlSuccess = await connectMySQL();

  // 2. Try connecting to MongoDB Database if configured
  if (mongoose) {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookbridge';
    try {
      const conn = await mongoose.connect(mongoURI, {
        maxPoolSize: 100,
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 45000,
      });

      isMongoConnected = true;
      console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
    } catch (error) {
      isMongoConnected = false;
    }
  }

  if (!mysqlSuccess && !isMongoConnected) {
    console.log('[DB Info] Standard JSON DB engine active as fallback.');
  }

  return mysqlSuccess || isMongoConnected;
};

const getMongoStatus = () => isMongoConnected;

module.exports = {
  connectDB,
  getMongoStatus,
  connectMySQL,
  getMySQLStatus,
  queryMySQL
};
