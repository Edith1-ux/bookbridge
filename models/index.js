/**
 * ==========================================================================
 * SEQUELIZE MODELS REGISTRY & ASSOCIATIONS
 * Central hub for relational mapping, indexing, and repeatable sync
 * ==========================================================================
 */

const { sequelize } = require('../config/db');
const User = require('./User');
const Book = require('./Book');
const Conversation = require('./Conversation');
const Message = require('./Message');
const PasswordResetToken = require('./PasswordResetToken');
const Notification = require('./Notification');
const Wishlist = require('./Wishlist');
const AuditLog = require('./AuditLog');

if (sequelize && User && Book) {
  // User <-> Book Relationships
  User.hasMany(Book, { foreignKey: 'sellerId', as: 'books', onDelete: 'SET NULL' });
  Book.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

  // Conversation <-> User & Book
  if (Conversation) {
    Conversation.belongsTo(Book, { foreignKey: 'bookId', as: 'book', onDelete: 'SET NULL' });
    Conversation.belongsTo(User, { foreignKey: 'user1Id', as: 'user1', onDelete: 'CASCADE' });
    Conversation.belongsTo(User, { foreignKey: 'user2Id', as: 'user2', onDelete: 'CASCADE' });

    // Conversation <-> Message
    if (Message) {
      Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages', onDelete: 'CASCADE' });
      Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
      Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender', onDelete: 'CASCADE' });
      User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
    }
  }

  // PasswordResetToken <-> User
  if (PasswordResetToken) {
    User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'resetTokens', onDelete: 'CASCADE' });
    PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }

  // Notification <-> User
  if (Notification) {
    User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
    Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }

  // Wishlist <-> User & Book
  if (Wishlist) {
    User.hasMany(Wishlist, { foreignKey: 'userId', as: 'wishlists', onDelete: 'CASCADE' });
    Wishlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Wishlist.belongsTo(Book, { foreignKey: 'bookId', as: 'book', onDelete: 'CASCADE' });
  }

  // AuditLog <-> User
  if (AuditLog) {
    User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs', onDelete: 'SET NULL' });
    AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }
}

/**
 * Sync all relational tables safely
 */
const syncDatabase = async (options = {}) => {
  if (!sequelize) return false;
  try {
    await sequelize.sync(options);
    console.log('[Database Sync] Relational tables synchronized successfully.');
    return true;
  } catch (error) {
    console.error(`[Database Sync Error] Failed to sync tables: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Book,
  Conversation,
  Message,
  PasswordResetToken,
  Notification,
  Wishlist,
  AuditLog,
  syncDatabase
};
