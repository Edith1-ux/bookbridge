/**
 * ==========================================================================
 * JWT AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * ==========================================================================
 */

const jwt = require('jsonwebtoken');

const getSecret = () => process.env.JWT_SECRET || 'bookbridge_jwt_secret_production_enterprise_2026';

/**
 * Strict authentication: rejects request if token is missing or invalid
 */
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. Authentication token required.',
      status: 401
    });
  }

  jwt.verify(token, getSecret(), (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired access token. Please login again.',
        status: 403
      });
    }
    req.user = decoded;
    next();
  });
};

/**
 * Optional authentication: if token is present, populates req.user; otherwise proceeds
 */
exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, getSecret(), (err, decoded) => {
    if (!err) {
      req.user = decoded;
    } else {
      req.user = null;
    }
    next();
  });
};

/**
 * Role-based authorization guard
 */
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Permission denied. Insufficient role access.',
        status: 403
      });
    }
    next();
  };
};
