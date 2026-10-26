/**
 * ==========================================================================
 * ENTERPRISE API SECURITY MIDDLEWARE (Helmet, Rate Limiting & Strict CORS)
 * ==========================================================================
 */

const cors = require('cors');

let helmet = null;
let rateLimit = null;
try { helmet = require('helmet'); } catch (e) { helmet = null; }
try { rateLimit = require('express-rate-limit'); } catch (e) { rateLimit = null; }

exports.configureSecurity = (app) => {
  // 0. Enable proxy trust for reverse proxies (Render, Railway, Nginx)
  app.set('trust proxy', 1);

  // 1. Helmet Security Headers
  if (helmet) {
    app.use(helmet({
      contentSecurityPolicy: false, // Allows inline scripts on existing HTML pages
      crossOriginEmbedderPolicy: false
    }));
  }

  // 2. CORS Configuration
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:8000',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000'
  ];

  const allowedOrigins = [...new Set([...configuredOrigins, ...defaultOrigins])];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
      if (!origin) {
        return callback(null, true);
      }
      // Allow known localhost origins for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      // Allow Render hosted domains (*.onrender.com)
      if (origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      // Allow configured production origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS policy: Origin '${origin}' is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // 3. API Rate Limiting
  if (rateLimit) {
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'test' ? 10000 : 300,
      message: { error: 'Too many requests from this IP address. Please try again shortly.' },
      standardHeaders: true,
      legacyHeaders: false
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === 'test' ? 10000 : 25,
      message: { error: 'Too many attempts. Please try again in 15 minutes.' },
      standardHeaders: true,
      legacyHeaders: false
    });

    app.use('/api/', generalLimiter);
    app.use('/api/login', authLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/register', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/auth/forgot-password', authLimiter);
    app.use('/api/auth/reset-password', authLimiter);
  }
};
