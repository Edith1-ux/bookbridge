/**
 * ==========================================================================
 * BOOKBRIDGE AUTHORITATIVE PRODUCTION SERVER ENGINE
 * Node.js + Express + Socket.IO + MySQL (Sequelize) & Real-Time Chat
 * ==========================================================================
 */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Database & Models
const { connectDB, sequelize, getSQLStatus, getDialect } = require('./config/db');
const { syncDatabase } = require('./models');
const { seedDatabase } = require('./config/seed');

// Security & Middleware
const { configureSecurity } = require('./middleware/security');
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');
const {
  validateBookInput,
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
  validateMessageInput
} = require('./middleware/validate');

// Controllers
const authController = require('./controllers/authController');
const bookController = require('./controllers/bookController');
const chatController = require('./controllers/chatController');
const adminController = require('./controllers/adminController');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'bookbridge_jwt_secret_production_enterprise_2026';

// 1. Initialize Core Middleware & Security
app.set('trust proxy', 1);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
configureSecurity(app);

// 2. Initialize Socket.IO with Token Authentication
let io = null;
try {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  // Socket.IO Handshake Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // Allow anonymous connection for public broadcasts (e.g. live statistics, new books),
      // but mark socket as unauthenticated
      socket.user = null;
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        socket.user = null;
      } else {
        socket.user = decoded;
        socket.join(`user_${decoded.id}`);
      }
      next();
    });
  });

  io.on('connection', (socket) => {
    const userLabel = socket.user ? `${socket.user.name} (ID: ${socket.user.id})` : 'Anonymous';
    console.log(`[Socket.IO Client Connected] ${userLabel} - Socket ID: ${socket.id}`);

    // Join conversation room with participant verification
    socket.on('joinConversation', async (conversationId) => {
      if (!conversationId) return;
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
      }
    });

    // Real-time typing indicators
    socket.on('typing', ({ conversationId, isTyping }) => {
      if (conversationId && socket.user) {
        socket.to(`conversation_${conversationId}`).emit('userTyping', {
          conversationId,
          userId: socket.user.id,
          userName: socket.user.name,
          isTyping
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO Client Disconnected] ID: ${socket.id}`);
    });
  });
} catch (err) {
  console.warn('[Socket.IO] Initialization warning:', err.message);
}

// 3. Static File Serving Helper
const serveStaticFile = (res, filename) => {
  const candidates = [
    path.resolve(process.cwd(), filename),
    path.resolve(__dirname, filename),
    path.resolve(process.cwd(), 'dist', filename)
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.sendFile(filePath);
    }
  }

  res.status(404).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>404 Not Found - BookBridge</title></head><body><h2>Page not found</h2><p><a href="/browse.html">Go to Browse Books</a></p></body></html>`);
};

// 4. Serve Static Assets (CSS, JS, Images, Icons)
app.use(express.static(process.cwd(), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true
}));

// 5. HTML Frontend Page Routes
app.get(['/', '/index', '/index.html'], (req, res) => serveStaticFile(res, 'index.html'));
app.get(['/browse', '/browse.html', '/browse-books', '/browse-books.html'], (req, res) => serveStaticFile(res, 'browse.html'));
app.get(['/exchange', '/exchange.html'], (req, res) => serveStaticFile(res, 'exchange.html'));
app.get(['/donate', '/donate.html'], (req, res) => serveStaticFile(res, 'donate.html'));
app.get(['/sell', '/sell.html'], (req, res) => serveStaticFile(res, 'sell.html'));
app.get(['/about', '/about.html'], (req, res) => serveStaticFile(res, 'about.html'));
app.get(['/contact', '/contact.html'], (req, res) => serveStaticFile(res, 'contact.html'));
app.get(['/login', '/login.html'], (req, res) => serveStaticFile(res, 'login.html'));
app.get(['/register', '/register.html'], (req, res) => serveStaticFile(res, 'register.html'));
app.get(['/privacy', '/privacy.html'], (req, res) => serveStaticFile(res, 'privacy.html'));
app.get(['/terms', '/terms.html'], (req, res) => serveStaticFile(res, 'terms.html'));
app.get(['/forgot-password', '/forgot-password.html'], (req, res) => serveStaticFile(res, 'forgot-password.html'));
app.get(['/dashboard', '/dashboard.html'], (req, res) => serveStaticFile(res, 'dashboard.html'));
app.get(['/admin', '/admin.html'], (req, res) => serveStaticFile(res, 'admin.html'));

/* ==========================================================================
   REST API ENDPOINTS
   ========================================================================== */

// 6. Health Check Endpoint (Render & Uptime Monitors)
app.get('/api/health', (req, res) => {
  const isHealthy = getSQLStatus();
  const statusCode = isHealthy ? 200 : (process.env.NODE_ENV === 'production' ? 503 : 200);

  res.status(statusCode).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'BookBridge Enterprise Engine',
    database: {
      connected: isHealthy,
      dialect: getDialect()
    },
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// 7. Platform Statistics (Computed live from Database)
app.get(['/api/statistics', '/api/statistics/'], bookController.getStatistics);

// 8. Authentication & Password Reset Endpoints
app.post(['/api/register', '/api/auth/register'], validateRegisterInput, authController.register);
app.post(['/api/login', '/api/auth/login'], validateLoginInput, authController.login);
app.get(['/api/auth/me', '/api/users/profile'], authenticateToken, authController.getMe);
app.put('/api/users/profile', authenticateToken, authController.updateProfile);
app.post('/api/auth/forgot-password', validateForgotPasswordInput, authController.forgotPassword);
app.get('/api/auth/verify-reset-token/:token', authController.verifyResetToken);
app.post('/api/auth/reset-password', validateResetPasswordInput, authController.resetPassword);

// 9. Book / Textbook Endpoints
app.get('/api/books', bookController.getBooks);
app.get('/api/books/:id', bookController.getBookById);
app.post('/api/books', authenticateToken, validateBookInput, (req, res, next) => bookController.createBook(req, res, next, io));
app.put('/api/books/:id', authenticateToken, validateBookInput, (req, res, next) => bookController.updateBook(req, res, next, io));
app.delete('/api/books/:id', authenticateToken, (req, res, next) => bookController.deleteBook(req, res, next, io));

// 10. Persistent Real-Time Chat & Messaging Endpoints
app.get('/api/conversations', authenticateToken, chatController.getConversations);
app.post('/api/conversations', authenticateToken, chatController.getOrCreateConversation);
app.get('/api/conversations/:id/messages', authenticateToken, chatController.getMessages);
app.post('/api/conversations/:id/messages', authenticateToken, validateMessageInput, (req, res, next) => chatController.sendMessage(req, res, next, io));

// Legacy Messaging API support (backward compatibility for existing frontend)
app.get('/api/messages', authenticateToken, chatController.getLegacyMessages);
app.post('/api/messages', authenticateToken, (req, res, next) => chatController.sendLegacyMessage(req, res, next, io));

// 11. Admin Endpoints (RBAC Enforced: Only Role 'admin')
app.get('/api/admin/stats', authenticateToken, authorizeRoles('admin'), adminController.getStats);
app.get('/api/admin/users', authenticateToken, authorizeRoles('admin'), adminController.getUsers);
app.put('/api/admin/users/:id/role', authenticateToken, authorizeRoles('admin'), adminController.updateUserRole);
app.put('/api/admin/users/:id/status', authenticateToken, authorizeRoles('admin'), adminController.toggleUserStatus);
app.get('/api/admin/logs', authenticateToken, authorizeRoles('admin'), adminController.getAuditLogs);

// 12. Catch-all HTML Route
app.get('/:page.html', (req, res) => {
  const pageFile = `${req.params.page}.html`;
  serveStaticFile(res, pageFile);
});

// 13. Centralized Error Handler Middleware
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation: ' + err.message, status: 403 });
  }

  const statusCode = err.status || err.statusCode || 500;
  console.error(`[Server Error] [${req.method} ${req.url}] ${err.stack || err.message}`);

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    status: statusCode
  });
});

// 14. Server Initialization Function
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Sync relational tables
    await syncDatabase({ alter: false });

    // In local dev, auto-seed default admin & GTU books if empty
    if (process.env.NODE_ENV !== 'production') {
      await seedDatabase();
    }

    server.listen(PORT, HOST, () => {
      console.log(`===================================================`);
      console.log(` 🌉 BookBridge 2.0 Production Engine Active`);
      console.log(` 📍 Local URL:     http://localhost:${PORT}`);
      console.log(` 📊 Health Check:  http://localhost:${PORT}/api/health`);
      console.log(` 📚 Browse Books:  http://localhost:${PORT}/browse.html`);
      console.log(` ⚡ Socket.IO:     Active on /socket.io/socket.io.js`);
      console.log(` 🗄️  Database:      ${getDialect().toUpperCase()} Engine (${getSQLStatus() ? 'Connected' : 'Offline'})`);
      console.log(`===================================================`);
    });
  } catch (error) {
    console.error(`[Fatal Startup Error] Failed to initialize BookBridge engine:`, error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      // Local dev fallback server listening even if DB connection has issues
      server.listen(PORT, HOST, () => {
        console.log(`[Dev Warning] Server started on port ${PORT} with database offline.`);
      });
    }
  }
};

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('[Shutdown] SIGTERM received. Closing HTTP server and database pool...');
  server.close(async () => {
    if (sequelize) await sequelize.close();
    console.log('[Shutdown] Server and database cleanly closed.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('[Shutdown] SIGINT received. Closing HTTP server and database pool...');
  server.close(async () => {
    if (sequelize) await sequelize.close();
    console.log('[Shutdown] Server and database cleanly closed.');
    process.exit(0);
  });
});

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
