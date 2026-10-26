/**
 * ==========================================================================
 * SEQUELIZE AUDIT LOG MODEL
 * Security auditing for logins, password resets, role changes & admin actions
 * ==========================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let AuditLog = null;

if (sequelize) {
  AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      defaultValue: ''
    },
    userAgent: {
      type: DataTypes.STRING(255),
      defaultValue: ''
    },
    details: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    indexes: [
      { fields: ['action'] },
      { fields: ['userId'] },
      { fields: ['createdAt'] }
    ]
  });
}

module.exports = AuditLog;
