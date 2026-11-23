// routes/messages.js - Message routes for CONVO
// Handles sending messages and fetching message history for a conversation.

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/messages/:conversationId
 * Query: ?limit=50&before=<messageId> for pagination
 * Returns messages for a conversation the user is a member of.
 * Requires authentication.
 */
router.get('/:conversationId', authenticateToken, (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const before = req.query.before ? parseInt(req.query.before) : null;

  // Verify user is a member of this conversation
  db.get(
    'SELECT 1 FROM members WHERE conversation_id = ? AND user_id = ?',
    [conversationId, userId],
    (err, member) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!member) {
        return res.status(403).json({ error: 'Not a member of this conversation' });
      }

      let sql = `
        SELECT m.id, m.conversation_id, m.sender_id, m.body, m.created_at, m.read_at,
               u.username AS sender_username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
      `;
      const params = [conversationId];

      if (before) {
        sql += ' AND m.id < ?';
        params.push(before);
      }

      sql += ' ORDER BY m.id DESC LIMIT ?';
      params.push(limit);

      db.all(sql, params, (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        // Reverse so oldest comes first
        res.json({ messages: rows.reverse(), conversationId });
      });
    }
  );
});

/**
 * POST /api/messages
 * Body: { conversationId, body }
 * Sends a new message to a conversation. Only members can send.
 * Requires authentication.
 */
router.post('/', authenticateToken, (req, res) => {
  const { conversationId, body } = req.body;
  const senderId = req.user.id;

  if (!conversationId || !body || body.trim() === '') {
    return res.status(400).json({ error: 'Conversation ID and message body are required' });
  }

  // Verify membership
  db.get(
    'SELECT 1 FROM members WHERE conversation_id = ? AND user_id = ?',
    [conversationId, senderId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ error: 'Not a member of this conversation' });
      }

      db.run(
        'INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)',
        [conversationId, senderId, body.trim()],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to send message' });
          }

          const messageId = this.lastID;
          db.get(
            `SELECT m.id, m.conversation_id, m.sender_id, m.body, m.created_at,
                    u.username AS sender_username
             FROM messages m JOIN users u ON m.sender_id = u.id
             WHERE m.id = ?`,
            [messageId],
            (err, row) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.status(201).json({ message: row });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
