// Simple authentication middleware for Express
// Assumes userId is sent in req.header('Authorization') as a token or in req.body.userId

const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  // Try to get token from header
  let token = req.header('Authorization');
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  // If using JWT, verify and extract user
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded.id || decoded._id || decoded;
      return next();
    } catch (err) {
      // Invalid token, fallback to userId in body
    }
  }

  // Fallback: allow userId in body (for dev/testing)
  if (req.body && req.body.userId) {
    req.user = req.body.userId;
    return next();
  }

  // Not authenticated
  return res.status(401).json({ error: 'Unauthorized' });
};
