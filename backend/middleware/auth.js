// middleware/auth.js - JWT authentication middleware for CONVO
// Verifies the Authorization: Bearer <token> header on protected routes.

const jwt = require('jsonwebtoken');

// Secret key for JWT signing. In production, use a strong env variable.
const JWT_SECRET = process.env.JWT_SECRET || 'convo-secret-change-in-production';

/**
 * authenticateToken middleware
 * Extracts the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded user payload to req.user.
 * Returns 401 if no token or invalid token.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // { id, username, email }
    next();
  });
}

module.exports = { authenticateToken, JWT_SECRET };
