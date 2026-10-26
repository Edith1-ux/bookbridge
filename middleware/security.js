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
  // 0. Enable proxy trust for reverse proxies (Railway, Render, Nginx)
  app.set('trust proxy', 1);

  // 1. Helmet Security Headers (if installed)
  if (helmet) {
    app.use(helmet({ contentSecurityPolicy: false }));
  }

  // 2. CORS Configuration — FIX: else branch now properly rejects non-allowed origins
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:8000',
    'http://localhost:3000',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:3000',
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Allow known localhost origins for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
        return;
      }
      // Allow configured production origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      // FIX: Previously BOTH branches returned callback(null, true) — now properly rejects
      callback(new Error(`CORS policy: Origin '${origin}' is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // 3. API Rate Limiting (if installed)
  if (rateLimit) {
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200,
      message: { error: 'Too many requests from this IP, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Stricter limit for auth endpoints to prevent brute-force attacks
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    app.use('/api/', apiLimiter);
    app.use('/api/login', authLimiter);
    app.use('/api/register', authLimiter);
  }
};
