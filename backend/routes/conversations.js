// routes/conversations.js - Conversation routes for CONVO
// Handles creating direct chats and group chats, and listing user conversations.

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/conversations
 * Returns all conversations the authenticated user is a member of,
 * including the other participant's info for direct chats.
 * Requires authentication.
 */
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT c.id, c.name, c.is_group, c.created_at,
           u.username AS other_username, u.id AS other_user_id
    FROM conversations c
    JOIN members m ON c.id = m.conversation_id
    LEFT JOIN users u ON c.is_group = 0 AND u.id != ?
    WHERE m.user_id = ?
    ORDER BY c.created_at DESC
  `;

  db.all(sql, [userId, userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ conversations: rows });
  });
});

/**
 * POST /api/conversations/direct
 * Body: { participantId }
 * Creates or retrieves a direct (1-on-1) conversation between the
 * authenticated user and the given participant.
 */
router.post('/direct', authenticateToken, (req, res) => {
  const { participantId } = req.body;
  const userId = req.user.id;

  if (!participantId || participantId == userId) {
    return res.status(400).json({ error: 'Invalid participant' });
  }

  // Verify participant exists
  db.get('SELECT id FROM users WHERE id = ?', [participantId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Check if a direct conversation already exists between these two users
    const findSql = `
      SELECT c.id
      FROM conversations c
      JOIN members m1 ON c.id = m1.conversation_id AND m1.user_id = ?
      JOIN members m2 ON c.id = m2.conversation_id AND m2.user_id = ?
      WHERE c.is_group = 0
    `;
    db.get(findSql, [userId, participantId], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        // Conversation already exists
        return res.json({ conversation: { id: row.id, is_group: false }, existing: true });
      }

      // Create new direct conversation
      db.run(
        'INSERT INTO conversations (name, is_group, created_by) VALUES (?, 0, ?)',
        [null, userId],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create conversation' });
          }
          const convId = this.lastID;

          // Add both users as members
          db.run('INSERT INTO members (conversation_id, user_id) VALUES (?, ?)', [convId, userId]);
          db.run('INSERT INTO members (conversation_id, user_id) VALUES (?, ?)', [convId, participantId]);

          res.status(201).json({
            conversation: { id: convId, is_group: false },
            existing: false,
          });
        }
      );
    });
  });
});

/**
 * POST /api/conversations/group
 * Body: { name, memberIds: [number] }
 * Creates a new group chat with the authenticated user as creator.
 */
router.post('/group', authenticateToken, (req, res) => {
  const { name, memberIds } = req.body;
  const userId = req.user.id;

  if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ error: 'Group name and members are required' });
  }

  // Include the creator in the member list if not already present
  const allMembers = [...new Set([...memberIds, userId])];

  db.run(
    'INSERT INTO conversations (name, is_group, created_by) VALUES (?, 1, ?)',
    [name, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create group' });
      }
      const convId = this.lastID;

      // Add all members
      const stmt = db.prepare('INSERT INTO members (conversation_id, user_id) VALUES (?, ?)');
      allMembers.forEach((uid) => stmt.run(convId, uid));
      stmt.finalize();

      res.status(201).json({
        conversation: { id: convId, name, is_group: true },
        members: allMembers,
      });
    }
  );
});

module.exports = router;
