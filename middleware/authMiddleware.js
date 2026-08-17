/**
 * ==========================================================================
 * JWT AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * ==========================================================================
 */

let jwt = null;
try { jwt = require('jsonwebtoken'); } catch (e) { jwt = null; }

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('[Security Warning] JWT_SECRET is not set in environment variables. Using insecure fallback for development only.');
}

const _secret = JWT_SECRET || 'super_secret_enterprise_bookbridge_key_2026_DEV_ONLY';

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // FIX: No longer silently allows unauthenticated requests through
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token required.' });
  }

  // FIX: No longer skips verification if JWT module is unavailable
  if (!jwt) {
    console.error('[Auth] jsonwebtoken module not installed. Cannot verify tokens.');
    return res.status(500).json({ error: 'Server authentication module not available.' });
  }

  jwt.verify(token, _secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token. Please login again.' });
    }
    req.user = decoded;
    next();
  });
};

exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied. Insufficient role access.' });
    }
    next();
  };
};
