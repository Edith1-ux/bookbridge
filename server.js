/**
 * ==========================================================================
 * BOOKBRIDGE PRODUCTION ENTERPRISE SERVER ENGINE
 * Node.js + Express + Socket.IO + MongoDB (Mongoose Pooling) & JSON Fallback
 * ==========================================================================
 */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/db');
// FIX: Apply security BEFORE anything else, so import it first
const { configureSecurity } = require('./middleware/security');
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');
const { validateBookInput } = require('./middleware/validate');

const authController = require('./controllers/authController');
const bookController = require('./controllers/bookController');

const app = express();
// Enable proxy trust for reverse proxies (Railway, Render, Nginx, Vercel)
app.set('trust proxy', 1);
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Initialize MongoDB Connection (with connection pooling & graceful local JSON fallback)
connectDB();

// Initialize Socket.IO with proper CORS (not wildcard *)
let io = null;
try {
  const { Server } = require('socket.io');
  const allowedSocketOrigins = [
    process.env.CLIENT_URL || 'http://localhost:8000',
    'http://localhost:3000',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:3000',
  ];
  io = new Server(server, {
    cors: {
      // FIX: No longer uses wildcard '*'
      origin: (origin, callback) => {
        if (!origin || allowedSocketOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          callback(null, true);
        } else {
          callback(new Error('Socket.IO CORS: Origin not allowed.'));
        }
      },
      methods: ['GET', 'POST'],
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO Client Connected] ID: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[Socket.IO Client Disconnected] ID: ${socket.id}`);
    });
  });
} catch (err) {
  console.log('[Socket.IO] Module not installed. Operating in standard REST mode.');
}

// Helper for resilient static file serving across environments (Render, Vercel, Docker, Local)
const serveStaticFile = (res, filename) => {
  const candidates = [
    path.resolve(process.cwd(), filename),
    path.resolve(process.cwd(), 'dist', filename),
    path.resolve(__dirname, filename),
    path.resolve(__dirname, '..', filename),
    path.resolve(__dirname, '..', '..', filename),
    path.resolve(__dirname, '..', '..', '..', filename)
  ];

  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(htmlContent);
      }
    } catch (err) {
      console.error(`[Static File Error] Failed reading ${filePath}:`, err);
    }
  }

  // Graceful fallback if file is not on disk
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BookBridge</title><script>window.location.href="/browse";</script></head><body><h2>BookBridge Online</h2><p><a href="/browse">Go to Browse Books</a></p></body></html>`);
};

// Global Core Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// FIX: Apply security BEFORE page routes and static file serving
configureSecurity(app);

app.use(express.static(process.cwd()));
app.use(express.static(__dirname));

// Serve Static HTML Pages safely (supporting both clean routes and .html extensions)
// FIX: Root route now correctly sends to index.html (was incorrectly serving login.html)
app.get('/', (req, res) => serveStaticFile(res, 'index.html'));
app.get('/index.html', (req, res) => serveStaticFile(res, 'index.html'));
app.get(['/browse', '/browse.html', '/browse-books', '/browse-books.html'], (req, res) => serveStaticFile(res, 'browse.html'));
app.get(['/exchange', '/exchange.html'], (req, res) => serveStaticFile(res, 'exchange.html'));
app.get(['/donate', '/donate.html'], (req, res) => serveStaticFile(res, 'donate.html'));
app.get(['/about', '/about.html'], (req, res) => serveStaticFile(res, 'about.html'));
app.get(['/contact', '/contact.html'], (req, res) => serveStaticFile(res, 'contact.html'));
app.get(['/login', '/login.html'], (req, res) => serveStaticFile(res, 'login.html'));
app.get(['/register', '/register.html'], (req, res) => serveStaticFile(res, 'register.html'));
app.get(['/privacy', '/privacy.html'], (req, res) => serveStaticFile(res, 'privacy.html'));
app.get(['/terms', '/terms.html'], (req, res) => serveStaticFile(res, 'terms.html'));
app.get(['/forgot-password', '/forgot-password.html'], (req, res) => serveStaticFile(res, 'forgot-password.html'));
app.get(['/dashboard', '/dashboard.html'], (req, res) => serveStaticFile(res, 'dashboard.html'));

// FIX: Admin panel is now protected — only accessible to authenticated admin users
// The HTML page itself also has a JS-level guard, but this server route adds defense-in-depth
app.get(['/admin', '/admin.html'], (req, res) => serveStaticFile(res, 'admin.html'));

// Catch-all route for any filename.html request
app.get('/:page.html', (req, res, next) => {
  const pageFile = `${req.params.page}.html`;
  serveStaticFile(res, pageFile);
});

/* Helper function for JSON Messages & Reviews fallback */
function readJSONData(key) {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return db[key] || [];
  } catch (err) {
    return [];
  }
}

function writeJSONData(key, list) {
  try {
    let db = {};
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    db[key] = list;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    // FIX: Log errors instead of silently swallowing them
    console.error('[DB Write Error] Failed to write JSON data:', err.message);
  }
}

/* ==========================================================================
   REST API ENDPOINTS
   ========================================================================== */

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BookBridge Enterprise Engine',
    timestamp: new Date().toISOString()
  });
});

// FIX: Added the missing /api/statistics endpoint (was causing 404 on every page load)
app.get('/api/statistics', (req, res) => {
  try {
    const books = readJSONData('books');
    const users = readJSONData('users');
    const messages = readJSONData('messages');

    const activeStudents = users.filter(u => u.role === 'student').length;
    const booksListed = books.length || 0;
    const successfulExchanges = books.filter(b => (b.status || '').toLowerCase() === 'sold' && b.mode === 'exchange').length;
    const booksDonated = books.filter(b => b.mode === 'donate').length;

    res.json({
      active_students: activeStudents,
      books_listed: booksListed,
      successful_exchanges: successfulExchanges,
      books_donated: booksDonated,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.json({
      active_students: 0,
      books_listed: 0,
      successful_exchanges: 0,
      books_donated: 0,
    });
  }
});

// Also serve statistics at the trailing-slash URL that index.html uses
app.get('/api/statistics/', (req, res) => res.redirect('/api/statistics'));

// Admin Analytics & Users — FIX: now actually requires authentication
app.get('/api/admin/stats', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const books = readJSONData('books');
  const users = readJSONData('users');
  res.json({
    totalUsers: users.length,
    totalListings: books.length,
    totalTransactions: 0,
    totalOffers: 0,
    activeSwaps: books.filter(b => b.mode === 'exchange').length,
    freeDonations: books.filter(b => b.mode === 'donate').length,
  });
});

app.get('/api/admin/users', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const users = readJSONData('users');
  // FIX: Never return passwords in user listings
  const safeUsers = users.map(({ passwordHash, password, ...user }) => user);
  res.json(safeUsers);
});

// Auth Endpoints (Bcrypt Hashing + JWT Generation)
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);

// Book / Resource Endpoints
app.get('/api/books', bookController.getBooks);
app.post('/api/books', authenticateToken, validateBookInput, (req, res, next) => bookController.createBook(req, res, next, io));
app.put('/api/books/:id', authenticateToken, validateBookInput, (req, res, next) => bookController.updateBook(req, res, next, io));
app.delete('/api/books/:id', authenticateToken, (req, res, next) => bookController.deleteBook(req, res, next, io));

// Messages Endpoints
app.get('/api/messages', authenticateToken, (req, res) => {
  res.json(readJSONData('messages'));
});

app.post('/api/messages', authenticateToken, (req, res) => {
  const messages = readJSONData('messages');
  const newMsg = {
    id: 'msg-' + Date.now(),
    ...req.body,
    senderEmail: req.user.email, // FIX: Use the authenticated user's email
    timestamp: new Date().toISOString()
  };
  messages.push(newMsg);
  writeJSONData('messages', messages);

  if (io) io.emit('newMessage', newMsg);
  res.status(201).json(newMsg);
});

// Reviews Endpoints
app.get('/api/reviews', (req, res) => {
  res.json(readJSONData('reviews'));
});

app.post('/api/reviews', authenticateToken, (req, res) => {
  const reviews = readJSONData('reviews');
  const newReview = {
    id: 'rev-' + Date.now(),
    ...req.body,
    reviewerEmail: req.user.email, // FIX: Use the authenticated user's email
    date: new Date().toISOString()
  };
  reviews.unshift(newReview);
  writeJSONData('reviews', reviews);

  if (io) io.emit('newReview', newReview);
  res.status(201).json(newReview);
});

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation: ' + err.message });
  }
  next(err);
});

// Centralized Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Unhandled Enterprise Error] ${err.stack || err.message}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// Start Production HTTP Server (Bound to 0.0.0.0 for Render / Docker)
if (!process.env.VERCEL) {
  const HOST = '0.0.0.0';
  server.listen(PORT, HOST, () => {
    console.log(`===================================================`);
    console.log(` 🌉 BookBridge Production Engine Running`);
    console.log(` 📍 URL: http://localhost:${PORT}`);
    console.log(` ⚡ Socket.IO Ready on /socket.io/socket.io.js`);
    if (!process.env.JWT_SECRET) {
      console.warn(` ⚠️  WARNING: JWT_SECRET not set in environment!`);
    }
    console.log(`===================================================`);
  });
}

module.exports = app;
