/**
 * ==========================================================================
 * SEQUELIZE USER MODEL
 * Enterprise User Schema with GTU Academic Attributes, RBAC & Status
 * ==========================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let User = null;

if (sequelize) {
  User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    enrollment: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    branch: {
      type: DataTypes.STRING(50),
      defaultValue: 'CE'
    },
    semester: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: { min: 1, max: 8 }
    },
    division: {
      type: DataTypes.STRING(50),
      defaultValue: 'Div A'
    },
    academicYear: {
      type: DataTypes.STRING(50),
      defaultValue: '2025-2026'
    },
    whatsapp: {
      type: DataTypes.STRING(50),
      defaultValue: ''
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'student', // 'student', 'faculty', 'alumni', 'admin'
      validate: {
        isIn: [['student', 'faculty', 'alumni', 'admin']]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      defaultValue: ''
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['enrollment'] },
      { fields: ['role'] }
    ]
  });
}

module.exports = User;
