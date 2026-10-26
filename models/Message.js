/**
 * ==========================================================================
 * SEQUELIZE MESSAGE MODEL
 * Real-time persistent messages stored in MySQL with delivery & read tracking
 * ==========================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let Message = null;

if (sequelize) {
  Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    senderName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    senderEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      { fields: ['conversationId'] },
      { fields: ['senderId'] },
      { fields: ['createdAt'] }
    ]
  });
}

module.exports = Message;
