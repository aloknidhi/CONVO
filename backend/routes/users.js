// routes/users.js - User routes for CONVO
// Provides user lookup so users can find others to start chats with.

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/users
 * Query: ?q=search term
 * Returns a list of users matching the search (excluding the current user).
 * Requires authentication.
 */
router.get('/', authenticateToken, (req, res) => {
  const search = req.query.q || '';
  const currentUserId = req.user.id;

  const sql = `
    SELECT id, username, email
    FROM users
    WHERE id != ? AND (username LIKE ? OR email LIKE ?)
    ORDER BY username
    LIMIT 20
  `;
  const like = `%${search}%`;

  db.all(sql, [currentUserId, like, like], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ users: rows });
  });
});

/**
 * GET /api/users/:id
 * Returns a single user's public profile by ID.
 * Requires authentication.
 */
router.get('/:id', authenticateToken, (req, res) => {
  const sql = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: row });
  });
});

module.exports = router;
