-- ==========================================================================
-- BOOKBRIDGE PRODUCTION MYSQL SQL SCHEMA & SEED DATA
-- Database Engine: MySQL 8.0+ / MariaDB (InnoDB, UTF8MB4)
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS `bookbridge` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bookbridge`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `enrollment_number` VARCHAR(50) UNIQUE DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `branch` VARCHAR(100) DEFAULT 'CE',
  `semester` INT DEFAULT 5,
  `division` VARCHAR(20) DEFAULT 'Div A',
  `academic_year` VARCHAR(20) DEFAULT '2025-2026',
  `whatsapp` VARCHAR(20) DEFAULT '',
  `role` ENUM('STUDENT', 'FACULTY', 'ALUMNI', 'ADMIN') DEFAULT 'STUDENT',
  `avatar` VARCHAR(255) DEFAULT '',
  `rating` DECIMAL(3,2) DEFAULT 5.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Books / Resources Table (Physical & Digital)
CREATE TABLE IF NOT EXISTS `books` (
  `id` VARCHAR(36) NOT NULL,
  `category` ENUM('physical', 'digital') DEFAULT 'physical',
  `title` VARCHAR(255) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `isbn` VARCHAR(50) DEFAULT 'N/A',
  `gtu_code` VARCHAR(50) DEFAULT '',
  `resource_type` VARCHAR(100) DEFAULT 'textbook',
  `genre` VARCHAR(100) DEFAULT 'Computer Engineering',
  `subject` VARCHAR(100) DEFAULT 'General',
  `semester` INT DEFAULT 5,
  `branch` VARCHAR(100) DEFAULT 'CE',
  `edition` VARCHAR(50) DEFAULT '2025 Ed',
  `publisher` VARCHAR(100) DEFAULT 'Atul Prakashan',
  `book_condition` ENUM('Brand New', 'Like New', 'Excellent', 'Good', 'Fair') DEFAULT 'Good',
  `language` VARCHAR(50) DEFAULT 'English',
  `mode` ENUM('sell', 'exchange', 'donate', 'buy') DEFAULT 'exchange',
  `price` DECIMAL(10,2) DEFAULT 0.00,
  `original_price` DECIMAL(10,2) DEFAULT 0.00,
  `exchange_for` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `pdf_url` VARCHAR(500) DEFAULT NULL,
  `contact_preference` VARCHAR(50) DEFAULT 'Both',
  `seller_id` VARCHAR(36) NOT NULL,
  `seller_name` VARCHAR(255) DEFAULT 'Student',
  `seller_role` VARCHAR(50) DEFAULT 'student',
  `seller_email` VARCHAR(255) DEFAULT '',
  `seller_whatsapp` VARCHAR(20) DEFAULT '',
  `location` VARCHAR(255) DEFAULT 'RCTI Campus, Ahmedabad',
  `cover_gradient` VARCHAR(255) DEFAULT 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  `icon` VARCHAR(10) DEFAULT '📚',
  `status` ENUM('Available', 'Reserved', 'Sold', 'Exchanged') DEFAULT 'Available',
  `views_count` INT DEFAULT 0,
  `wishlist_count` INT DEFAULT 0,
  `rating` DECIMAL(3,2) DEFAULT 4.80,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_books_mode` (`mode`),
  INDEX `idx_books_status` (`status`),
  INDEX `idx_books_branch_sem` (`branch`, `semester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Wishlists Table
CREATE TABLE IF NOT EXISTS `wishlists` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `book_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_book_wishlist` (`user_id`, `book_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Orders / Transactions Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) NOT NULL,
  `book_id` VARCHAR(36) NOT NULL,
  `buyer_id` VARCHAR(36) NOT NULL,
  `seller_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) DEFAULT 'UPI',
  `payment_status` ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
  `order_status` ENUM('pending', 'processing', 'delivered', 'cancelled') DEFAULT 'delivered',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Exchanges Table
CREATE TABLE IF NOT EXISTS `exchanges` (
  `id` VARCHAR(36) NOT NULL,
  `target_book_id` VARCHAR(36) NOT NULL,
  `offered_book_title` VARCHAR(255) NOT NULL,
  `proposer_id` VARCHAR(36) NOT NULL,
  `owner_id` VARCHAR(36) NOT NULL,
  `status` ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
  `note` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`target_book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`proposer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Donations Table
CREATE TABLE IF NOT EXISTS `donations` (
  `id` VARCHAR(36) NOT NULL,
  `book_id` VARCHAR(36) NOT NULL,
  `donor_id` VARCHAR(36) NOT NULL,
  `claimant_id` VARCHAR(36) DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'fulfilled', 'rejected') DEFAULT 'approved',
  `note` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`donor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Chat / Support Messages Table
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `receiver_id` VARCHAR(36) DEFAULT NULL,
  `book_id` VARCHAR(36) DEFAULT NULL,
  `text` TEXT NOT NULL,
  `read_status` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Reviews Table
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(36) NOT NULL,
  `seller_id` VARCHAR(36) NOT NULL,
  `reviewer_id` VARCHAR(36) NOT NULL,
  `reviewer_name` VARCHAR(255) NOT NULL,
  `rating` INT DEFAULT 5,
  `comment` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
