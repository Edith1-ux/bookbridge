/**
 * ==========================================================================
 * BOOKBRIDGE BOOK CONTROLLER
 * Full GTU Marketplace CRUD, Filter & Search Queries backed by MySQL
 * ==========================================================================
 */

const { Op } = require('sequelize');
const { Book, User } = require('../models');

/**
 * GET /api/books
 * Supports search query, branch, semester, category, mode, and condition filters
 */
exports.getBooks = async (req, res, next) => {
  try {
    const { query, mode, genre, semester, branch, resourceType, condition, category, sellerId } = req.query;

    let where = {};

    // Text search on title, author, subject, or gtuCode
    if (query && query.trim() !== '') {
      const searchTerm = `%${query.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: searchTerm } },
        { author: { [Op.like]: searchTerm } },
        { subject: { [Op.like]: searchTerm } },
        { gtuCode: { [Op.like]: searchTerm } }
      ];
    }

    if (category && category.toLowerCase() !== 'all') {
      where.category = category;
    }

    if (mode && mode.toLowerCase() !== 'all') {
      where.mode = mode.toLowerCase();
    }

    if (branch && branch.toLowerCase() !== 'all') {
      where.branch = branch;
    }

    if (semester && semester.toLowerCase() !== 'all') {
      const semNum = parseInt(semester, 10);
      if (!isNaN(semNum)) where.semester = semNum;
    }

    if (resourceType && resourceType.toLowerCase() !== 'all') {
      where.resourceType = resourceType;
    }

    if (condition && condition.toLowerCase() !== 'all') {
      where.condition = condition;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    const books = await Book.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    return res.json(books);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/:id
 */
exports.getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'email', 'role', 'whatsapp', 'branch', 'semester', 'avatarUrl']
        }
      ]
    });

    if (!book) {
      return res.status(404).json({ error: 'Book listing not found.', status: 404 });
    }

    return res.json(book);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/books
 */
exports.createBook = async (req, res, next, io) => {
  try {
    const userId = req.user ? req.user.id : null;
    let seller = req.user;

    if (userId && !seller.email) {
      seller = await User.findByPk(userId);
    }

    const {
      title,
      author,
      gtuCode,
      category,
      resourceType,
      genre,
      subject,
      semester,
      branch,
      edition,
      condition,
      mode,
      price,
      exchangeFor,
      description,
      coverUrl,
      pdfUrl
    } = req.body;

    const newBook = await Book.create({
      title: title.trim(),
      author: author.trim(),
      gtuCode: gtuCode ? gtuCode.trim() : '',
      category: category || 'physical',
      resourceType: resourceType || 'textbook',
      genre: genre || 'Computer Engineering',
      subject: subject || 'General',
      semester: semester ? parseInt(semester, 10) : 1,
      branch: branch || 'CE',
      edition: edition || 'GTU Edition',
      condition: condition || 'Good',
      mode: (mode || 'sell').toLowerCase(),
      price: (mode && mode.toLowerCase() === 'donate') ? 0.00 : (parseFloat(price) || 0.00),
      exchangeFor: exchangeFor ? exchangeFor.trim() : '',
      description: description ? description.trim() : '',
      coverUrl: coverUrl || '',
      pdfUrl: pdfUrl || '',
      status: 'Available',
      sellerId: seller ? seller.id : null,
      sellerName: seller ? seller.name : 'Anonymous',
      sellerEmail: seller ? seller.email : '',
      sellerRole: seller ? seller.role : 'student',
      sellerWhatsapp: seller ? (seller.whatsapp || '') : ''
    });

    // Real-time broadcast to all connected clients
    if (io) {
      io.emit('newBook', newBook);
    }

    return res.status(201).json(newBook);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/books/:id
 */
exports.updateBook = async (req, res, next, io) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({ error: 'Book listing not found.', status: 404 });
    }

    // Permission check: only seller or admin can edit
    if (req.user && req.user.role !== 'admin' && book.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied. You can only edit your own listings.' });
    }

    const updatable = [
      'title', 'author', 'gtuCode', 'category', 'resourceType', 'genre',
      'subject', 'semester', 'branch', 'edition', 'condition', 'mode',
      'price', 'exchangeFor', 'description', 'coverUrl', 'pdfUrl', 'status'
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    });

    if (req.body.price !== undefined) {
      book.price = parseFloat(req.body.price) || 0;
    }

    await book.save();

    if (io) {
      io.emit('bookUpdated', book);
    }

    return res.json(book);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/books/:id
 */
exports.deleteBook = async (req, res, next, io) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({ error: 'Book listing not found.', status: 404 });
    }

    // Permission check
    if (req.user && req.user.role !== 'admin' && book.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied. You can only delete your own listings.' });
    }

    await book.destroy();

    if (io) {
      io.emit('bookDeleted', { id: parseInt(id, 10) });
    }

    return res.json({ message: 'Listing removed successfully.', id });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/statistics
 * Live platform statistics computed from real database records
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const activeStudents = await User.count({ where: { role: 'student', isActive: true } });
    const booksListed = await Book.count({ where: { status: 'Available' } });
    const successfulExchanges = await Book.count({ where: { status: 'Sold', mode: 'exchange' } });
    const booksDonated = await Book.count({ where: { mode: 'donate' } });
    const totalTransactions = await Book.count({ where: { status: 'Sold' } });

    return res.json({
      active_students: activeStudents,
      books_listed: booksListed,
      successful_exchanges: successfulExchanges,
      books_donated: booksDonated,
      total_transactions: totalTransactions,
      students: activeStudents,
      books: booksListed,
      exchanges: successfulExchanges,
      donated: booksDonated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
