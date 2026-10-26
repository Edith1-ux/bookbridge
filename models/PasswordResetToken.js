/**
 * ==========================================================================
 * SEQUELIZE PASSWORD RESET TOKEN MODEL
 * Cryptographically hashed, expiring single-use password recovery tokens
 * ==========================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let PasswordResetToken = null;

if (sequelize) {
  PasswordResetToken = sequelize.define('PasswordResetToken', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'password_reset_tokens',
    timestamps: true,
    indexes: [
      { fields: ['tokenHash'] },
      { fields: ['userId'] },
      { fields: ['expiresAt'] }
    ]
  });
}

module.exports = PasswordResetToken;
