/**
 * ==========================================================================
 * BOOKBRIDGE DATABASE SEEDER
 * Populates GTU syllabus textbooks and demo accounts into the SQL Database
 * ==========================================================================
 */

const bcrypt = require('bcryptjs');
const { connectDB } = require('./db');
const { User, Book, syncDatabase } = require('../models');

const SEED_USERS = [
  {
    name: 'Keval A. Prajapati (Group Lead)',
    enrollment: '246400307192',
    email: 'keval.ce@rcti.ac.in',
    password: 'password123',
    branch: 'CE',
    semester: 5,
    division: 'Div A',
    academicYear: '2025-2026',
    whatsapp: '+919876543210',
    role: 'student'
  },
  {
    name: 'RCTI System Administrator',
    enrollment: 'RCTI-ADMIN-01',
    email: 'admin@rcti.ac.in',
    password: 'password123',
    branch: 'CE',
    semester: 6,
    division: 'Div A',
    academicYear: '2025-2026',
    whatsapp: '+919876543210',
    role: 'admin'
  },
  {
    name: 'Demo Student',
    enrollment: '246400307001',
    email: 'student@rcti.ac.in',
    password: 'password123',
    branch: 'IT',
    semester: 4,
    division: 'Div B',
    academicYear: '2025-2026',
    whatsapp: '+919876543210',
    role: 'student'
  }
];

const SEED_BOOKS = [
  {
    title: 'Computer Programming',
    author: 'Atul Prakashan',
    gtuCode: '3110003',
    genre: 'Computer Engineering',
    branch: 'CE',
    subject: 'Computer Programming',
    semester: 1,
    category: 'physical',
    resourceType: 'textbook',
    condition: 'Like New',
    price: 320.00,
    mode: 'sell',
    coverUrl: 'browse_images/books/book1.jpg',
    status: 'Available',
    description: 'First semester GTU Computer Programming (C Language) textbook in like-new condition with solved past papers.'
  },
  {
    title: 'Engineering Mathematics-I',
    author: 'Atul Prakashan',
    gtuCode: '3110014',
    genre: 'Mathematics',
    branch: 'CE',
    subject: 'Calculus',
    semester: 1,
    category: 'physical',
    resourceType: 'textbook',
    condition: 'Good',
    price: 250.00,
    mode: 'sell',
    coverUrl: 'browse_images/books/book2.jpg',
    status: 'Available',
    description: 'GTU Engineering Mathematics-I covering calculus, differential equations, and vectors.'
  },
  {
    title: 'Applied Physics',
    author: 'Atul Prakashan',
    gtuCode: '3110018',
    genre: 'Science',
    branch: 'CE',
    subject: 'Applied Physics',
    semester: 1,
    category: 'physical',
    resourceType: 'textbook',
    condition: 'Excellent',
    price: 280.00,
    mode: 'sell',
    coverUrl: 'browse_images/books/book3.jpg',
    status: 'Available',
    description: 'Applied Physics standard textbook for Diploma/Degree engineering semester 1.'
  },
  {
    title: 'Applied Chemistry',
    author: 'Atul Prakashan',
    gtuCode: '3110011',
    genre: 'Science',
    branch: 'CE',
    subject: 'Applied Chemistry',
    semester: 1,
    category: 'physical',
    resourceType: 'textbook',
    condition: 'Good',
    price: 0.00,
    mode: 'donate',
    coverUrl: 'browse_images/books/book4.jpg',
    status: 'Available',
    description: 'Donating this chemistry book to any first-year GTU student in need. Clean pages.'
  },
  {
    title: 'Basic Electrical Engineering',
    author: 'Atul Prakashan',
    gtuCode: '3110005',
    genre: 'Electrical',
    branch: 'EE',
    subject: 'BEE',
    semester: 1,
    category: 'physical',
    resourceType: 'textbook',
    condition: 'Good',
    price: 0.00,
    mode: 'exchange',
    exchangeFor: 'Looking for Data Structures or OOP C++ Book',
    coverUrl: 'browse_images/books/book5.jpg',
    status: 'Available',
    description: 'Basic Electrical Engineering textbook. Willing to swap with 2nd or 3rd sem CS books.'
  },
  {
    title: 'Data Structures and Algorithms',
    author: 'Reema Thareja',
    gtuCode: '3130702',
    genre: 'Computer Engineering',
    branch: 'CE',
    subject: 'Data Structures',
    semester: 3,
    category: 'physical',
    resourceType: 'textbook',
    condition: 'Like New',
    price: 380.00,
    mode: 'sell',
    coverUrl: 'browse_images/books/book6.jpg',
    status: 'Available',
    description: 'In-depth DSA reference textbook with clear C code listings and algorithm complexity explanations.'
  },
  {
    title: 'Database Management Systems',
    author: 'Raghu Ramakrishnan',
    gtuCode: '3130703',
    genre: 'Computer Engineering',
    branch: 'CE',
    subject: 'DBMS',
    semester: 3,
    category: 'physical',
    resourceType: 'textbook',
    condition: 'Excellent',
    price: 450.00,
    mode: 'sell',
    coverUrl: 'browse_images/books/book7.jpg',
    status: 'Available',
    description: 'Comprehensive DBMS textbook covering SQL, normalization, relational algebra, and transaction recovery.'
  },
  {
    title: 'Operating System Design',
    author: 'Abraham Silberschatz',
    gtuCode: '3140702',
    genre: 'Computer Engineering',
    branch: 'CE',
    subject: 'Operating Systems',
    semester: 4,
    category: 'physical',
    resourceType: 'textbook',
    condition: 'Good',
    price: 390.00,
    mode: 'sell',
    coverUrl: 'browse_images/books/book8.jpg',
    status: 'Available',
    description: 'Silberschatz Dinosaur Book for Operating Systems. Great condition with covered binding.'
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    await syncDatabase({ alter: false });

    // Seed Users
    let adminUser = null;
    for (const userData of SEED_USERS) {
      const existing = await User.findOne({ where: { email: userData.email } });
      if (!existing) {
        const passwordHash = await bcrypt.hash(userData.password, 12);
        const { password, ...createData } = userData;
        const user = await User.create({ ...createData, passwordHash });
        console.log(`[Seed] Created User: ${user.email} (${user.role})`);
        if (user.role === 'admin') adminUser = user;
      } else {
        if (existing.role === 'admin') adminUser = existing;
      }
    }

    // Seed Books
    const bookCount = await Book.count();
    if (bookCount === 0) {
      for (const bookData of SEED_BOOKS) {
        await Book.create({
          ...bookData,
          sellerId: adminUser ? adminUser.id : null,
          sellerName: adminUser ? adminUser.name : 'System Admin',
          sellerEmail: adminUser ? adminUser.email : 'admin@rcti.ac.in',
          sellerRole: 'admin',
          sellerWhatsapp: '+919876543210'
        });
      }
      console.log(`[Seed] Successfully seeded ${SEED_BOOKS.length} GTU textbooks into database.`);
    } else {
      console.log(`[Seed] Database already contains ${bookCount} books. Skipping book seeds.`);
    }

    console.log('[Seed] Database initialization complete.');
    return true;
  } catch (error) {
    console.error(`[Seed Error] Failed to seed database: ${error.message}`);
    return false;
  }
};

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seedDatabase };
