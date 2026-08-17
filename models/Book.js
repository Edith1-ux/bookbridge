/**
 * ==========================================================================
 * SEQUELIZE BOOK / RESOURCE MODEL (Relational Schema & Seller Metadata)
 * ==========================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let Book = null;

if (sequelize) {
  Book = sequelize.define('Book', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false
    },
    gtuCode: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    category: {
      type: DataTypes.ENUM('physical', 'digital'),
      defaultValue: 'physical'
    },
    resourceType: {
      type: DataTypes.STRING,
      defaultValue: 'textbook'
    },
    genre: {
      type: DataTypes.STRING,
      defaultValue: 'Computer Engineering'
    },
    subject: {
      type: DataTypes.STRING,
      defaultValue: 'General'
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    branch: {
      type: DataTypes.STRING,
      allowNull: false
    },
    edition: {
      type: DataTypes.STRING,
      defaultValue: 'GTU Edition'
    },
    condition: {
      type: DataTypes.ENUM('Brand New', 'Like New', 'Excellent', 'Good', 'Fair'),
      defaultValue: 'Good'
    },
    mode: {
      type: DataTypes.ENUM('exchange', 'sell', 'buy', 'donate'),
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    exchangeFor: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    pdfUrl: {
      type: DataTypes.STRING(500),
      defaultValue: ''
    },
    status: {
      type: DataTypes.ENUM('Available', 'Reserved', 'Sold'),
      defaultValue: 'Available'
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sellerName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sellerEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sellerRole: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sellerWhatsapp: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'books',
    timestamps: true
  });
}

module.exports = Book;
