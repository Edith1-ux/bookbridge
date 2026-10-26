/**
 * ==========================================================================
 * SEQUELIZE CONVERSATION MODEL
 * Represents a chat thread between buyers, sellers, and book exchangers
 * ==========================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let Conversation = null;

if (sequelize) {
  Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bookTitle: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user1Id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user2Id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lastMessageText: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'conversations',
    timestamps: true,
    indexes: [
      { fields: ['user1Id'] },
      { fields: ['user2Id'] },
      { fields: ['bookId'] },
      { fields: ['lastMessageAt'] }
    ]
  });
}

module.exports = Conversation;
