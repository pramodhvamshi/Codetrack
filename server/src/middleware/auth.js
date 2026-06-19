const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    // Prefer cookie-parser populated cookies
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.cookie) {
      // Fallback: manual parse with quote stripping
      const cookies = {};
      req.headers.cookie.split(';').forEach(c => {
        const parts = c.split('=');
        const key = parts.shift().trim();
        const val = decodeURIComponent(parts.join('=')).trim().replace(/^"|"$/g, '');
        cookies[key] = val;
      });
      token = cookies['accessToken'];
    }
  }
  // Strip surrounding quotes if present (defensive)
  if (token) token = token.replace(/^"|"$/g, '');

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.id, role: decoded.role };

    // Optionally load full user for convenience (used in many handlers)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.currentUser = user;

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Access denied' });
    }
    return next();
  };
}

function requireAnyRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    return next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  requireAnyRole
};

