/**
 * ==========================================================================
 * SEQUELIZE USER MODEL (GTU Attributes, Bcrypt Hashing, RBAC)
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
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    enrollment: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    branch: {
      type: DataTypes.ENUM('CE', 'IT', 'ICT', 'EE', 'ME', 'CIVIL', 'PRINT', 'TMT', 'TPT'),
      defaultValue: 'CE'
    },
    semester: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    division: {
      type: DataTypes.STRING,
      defaultValue: 'Div A'
    },
    academicYear: {
      type: DataTypes.STRING,
      defaultValue: '2025-2026'
    },
    whatsapp: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    role: {
      type: DataTypes.ENUM('student', 'faculty', 'alumni', 'admin'),
      defaultValue: 'student'
    }
  }, {
    tableName: 'users',
    timestamps: true
  });
}

module.exports = User;
