/**
 * ==========================================================================
 * SEQUELIZE BOOK / RESOURCE MODEL
 * GTU Textbook catalog, marketplace listings, exchange and donation schema
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
      type: DataTypes.STRING(255),
      allowNull: false
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    gtuCode: {
      type: DataTypes.STRING(100),
      defaultValue: ''
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'physical' // 'physical', 'digital'
    },
    resourceType: {
      type: DataTypes.STRING(100),
      defaultValue: 'textbook'
    },
    genre: {
      type: DataTypes.STRING(100),
      defaultValue: 'Computer Engineering'
    },
    subject: {
      type: DataTypes.STRING(255),
      defaultValue: 'General'
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    branch: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'CE'
    },
    edition: {
      type: DataTypes.STRING(100),
      defaultValue: 'GTU Edition'
    },
    condition: {
      type: DataTypes.STRING(50),
      defaultValue: 'Good' // 'Brand New', 'Like New', 'Excellent', 'Good', 'Fair'
    },
    mode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'sell' // 'sell', 'exchange', 'donate', 'buy'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    exchangeFor: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    coverUrl: {
      type: DataTypes.STRING(500),
      defaultValue: ''
    },
    pdfUrl: {
      type: DataTypes.STRING(500),
      defaultValue: ''
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'Available' // 'Available', 'Reserved', 'Sold'
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sellerName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sellerEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sellerRole: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    sellerWhatsapp: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'books',
    timestamps: true,
    indexes: [
      { fields: ['branch', 'semester'] },
      { fields: ['mode'] },
      { fields: ['status'] },
      { fields: ['sellerId'] }
    ]
  });
}

module.exports = Book;
