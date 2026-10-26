/**
 * ==========================================================================
 * SEQUELIZE WISHLIST MODEL
 * Saved books and wishlists for students
 * ==========================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let Wishlist = null;

if (sequelize) {
  Wishlist = sequelize.define('Wishlist', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'wishlists',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['userId', 'bookId'] },
      { fields: ['userId'] }
    ]
  });
}

module.exports = Wishlist;
