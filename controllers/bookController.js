/**
 * ==========================================================================
 * BOOK CONTROLLER (MySQL Sequelize Queries + JSON Fallback Engine)
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Book = require('../models/Book');
const { getSQLStatus, getMongoStatus } = require('../config/db');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

function readJSONDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return { users: [], books: [], messages: [], reviews: [] };
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db.books) db.books = [];
    return db;
  } catch (err) {
    return { users: [], books: [], messages: [], reviews: [] };
  }
}

function writeJSONDB(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {}
}

const isDBConnected = () => (getSQLStatus && getSQLStatus()) || (getMongoStatus && getMongoStatus());

exports.getBooks = async (req, res, next) => {
  try {
    const { query, mode, genre, semester, branch, resourceType, condition, category } = req.query;

    if (isDBConnected() && Book && Book.findAll) {
      let where = {};

      if (query && query.trim() !== '') {
        const searchTerm = `%${query.trim()}%`;
        where[Op.or] = [
          { title: { [Op.like]: searchTerm } },
          { author: { [Op.like]: searchTerm } },
          { subject: { [Op.like]: searchTerm } },
          { gtuCode: { [Op.like]: searchTerm } }
        ];
      }

      if (category && category.toLowerCase() !== 'all') where.category = category;
      if (mode && mode.toLowerCase() !== 'all') where.mode = mode;
      if (branch && branch.toLowerCase() !== 'all') where.branch = branch;
      if (semester && semester.toLowerCase() !== 'all') where.semester = parseInt(semester, 10);
      if (resourceType && resourceType.toLowerCase() !== 'all') where.resourceType = resourceType;
      if (condition && condition.toLowerCase() !== 'all') where.condition = condition;

      const books = await Book.findAll({
        where,
        order: [['createdAt', 'DESC']]
      });

      return res.json(books);
    }

    // JSON Fallback Engine
    const db = readJSONDB();
    let books = db.books || [];

    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      books = books.filter(b =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.genre || '').toLowerCase().includes(q) ||
        (b.subject || '').toLowerCase().includes(q)
      );
    }

    if (category && category.toLowerCase() !== 'all') books = books.filter(b => (b.category || 'physical').toLowerCase() === category.toLowerCase());
    if (mode && mode.toLowerCase() !== 'all') books = books.filter(b => b.mode.toLowerCase() === mode.toLowerCase());
    if (genre && genre.toLowerCase() !== 'all') books = books.filter(b => b.genre.toLowerCase() === genre.toLowerCase() || (b.branch && b.branch.toLowerCase() === genre.toLowerCase()));
    if (semester && semester.toLowerCase() !== 'all') books = books.filter(b => b.semester && b.semester.toString() === semester.toString());
    if (branch && branch.toLowerCase() !== 'all') books = books.filter(b => b.branch === 'All' || (b.branch && b.branch.toLowerCase() === branch.toLowerCase()));
    if (resourceType && resourceType.toLowerCase() !== 'all') books = books.filter(b => b.resourceType === resourceType);
    if (condition && condition.toLowerCase() !== 'all') books = books.filter(b => b.condition === condition);

    res.json(books);
  } catch (error) {
    next(error);
  }
};

exports.createBook = async (req, res, next, io) => {
  try {
    const { seller } = req.body;

    if (isDBConnected() && Book && Book.create) {
      const newBook = await Book.create({
        ...req.body,
        semester: parseInt(req.body.semester || 5, 10),
        price: parseFloat(req.body.price || 0),
        sellerId: seller ? seller.id : null,
        sellerName: seller ? seller.name : null,
        sellerEmail: seller ? seller.email : null,
        sellerRole: seller ? seller.role : null,
        sellerWhatsapp: seller ? seller.whatsapp : null
      });

      if (io) io.emit('newBook', newBook);
      return res.status(201).json(newBook);
    }

    // JSON Fallback Engine
    const db = readJSONDB();
    const newBook = {
      id: 'rcti-' + Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    db.books.unshift(newBook);
    writeJSONDB(db);

    if (io) io.emit('newBook', newBook);
    res.status(201).json(newBook);
  } catch (error) {
    next(error);
  }
};

exports.updateBook = async (req, res, next, io) => {
  try {
    const bookId = req.params.id;

    if (isDBConnected() && Book && Book.findByPk) {
      const book = await Book.findByPk(bookId);
      if (!book) return res.status(404).json({ error: 'Resource not found' });

      await book.update(req.body);
      if (io) io.emit('bookUpdated', book);
      return res.json(book);
    }

    // JSON Fallback Engine
    const db = readJSONDB();
    const index = db.books.findIndex(b => b.id.toString() === bookId.toString());
    if (index >= 0) {
      db.books[index] = { ...db.books[index], ...req.body };
      writeJSONDB(db);
      if (io) io.emit('bookUpdated', db.books[index]);
      return res.json(db.books[index]);
    }
    res.status(404).json({ error: 'Resource not found' });
  } catch (error) {
    next(error);
  }
};

exports.deleteBook = async (req, res, next, io) => {
  try {
    const bookId = req.params.id;

    if (isDBConnected() && Book && Book.destroy) {
      await Book.destroy({ where: { id: bookId } });
      if (io) io.emit('bookDeleted', bookId);
      return res.json({ message: 'Book deleted successfully', id: bookId });
    }

    // JSON Fallback Engine
    const db = readJSONDB();
    db.books = db.books.filter(b => b.id.toString() !== bookId.toString());
    writeJSONDB(db);

    if (io) io.emit('bookDeleted', bookId);
    res.json({ message: 'Book deleted successfully', id: bookId });
  } catch (error) {
    next(error);
  }
};
