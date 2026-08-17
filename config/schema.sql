-- ==========================================================================
-- BOOKBRIDGE MYSQL DATABASE SCHEMA
-- Database: bookbridge
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS bookbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bookbridge;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  enrollment VARCHAR(100) UNIQUE,
  branch ENUM('CE', 'IT', 'ICT', 'EE', 'ME', 'CIVIL', 'PRINT', 'TMT', 'TPT') DEFAULT 'CE',
  semester INT DEFAULT 5,
  division VARCHAR(50) DEFAULT 'Div A',
  academicYear VARCHAR(50) DEFAULT '2025-2026',
  whatsapp VARCHAR(50) DEFAULT '',
  role ENUM('student', 'faculty', 'alumni', 'admin') DEFAULT 'student',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_enrollment (enrollment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Books Table
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  gtuCode VARCHAR(100) DEFAULT '',
  category ENUM('physical', 'digital') DEFAULT 'physical',
  resourceType VARCHAR(100) DEFAULT 'textbook',
  genre VARCHAR(100) DEFAULT 'Computer Engineering',
  subject VARCHAR(255) DEFAULT 'General',
  semester INT NOT NULL,
  branch VARCHAR(100) NOT NULL,
  edition VARCHAR(100) DEFAULT 'GTU Edition',
  `condition` ENUM('Brand New', 'Like New', 'Excellent', 'Good', 'Fair') DEFAULT 'Good',
  mode ENUM('exchange', 'sell', 'buy', 'donate') NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  exchangeFor TEXT,
  description TEXT,
  pdfUrl VARCHAR(500) DEFAULT '',
  status ENUM('Available', 'Reserved', 'Sold') DEFAULT 'Available',
  sellerId INT,
  sellerName VARCHAR(255),
  sellerEmail VARCHAR(255),
  sellerRole VARCHAR(50),
  sellerWhatsapp VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_books_branch_sem (branch, semester),
  INDEX idx_books_status (status),
  FULLTEXT idx_books_search (title, author, subject, gtuCode),
  FOREIGN KEY (sellerId) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
