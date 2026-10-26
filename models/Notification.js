/**
 * ==========================================================================
 * SEQUELIZE NOTIFICATION MODEL
 * System, chat, and transaction notifications for users
 * ==========================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let Notification = null;

if (sequelize) {
  Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      defaultValue: 'system' // 'message', 'offer', 'system', 'admin'
    },
    link: {
      type: DataTypes.STRING(500),
      defaultValue: ''
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isRead'] }
    ]
  });
}

module.exports = Notification;
