// socket/chat.js - Socket.io real-time chat handler for CONVO
// Manages WebSocket connections, joining conversation rooms, and broadcasting messages.

const { db } = require('../db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Map of socketId -> userId for tracking online users
const onlineUsers = new Map();

/**
 * Initialize Socket.io on the given server instance.
 * @param {object} io - Socket.io server instance
 */
function initSocket(io) {
  io.use((socket, next) => {
    // Authenticate socket connection via query token: ?token=JWT
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return next(new Error('Invalid token'));
      }
      socket.userId = user.id;
      socket.username = user.username;
      next();
    });
  });

  io.on('connection', (socket) => {
    onlineUsers.set(socket.id, { userId: socket.userId, username: socket.username });

    // Notify others that this user is online
    socket.broadcast.emit('user_online', { userId: socket.userId, username: socket.username });

    // Join a conversation room to receive real-time messages
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    // Handle sending a new message via WebSocket
    socket.on('send_message', (data, callback) => {
      const { conversationId, body } = data;
      const senderId = socket.userId;

      if (!conversationId || !body) {
        if (callback) callback({ error: 'Missing fields' });
        return;
      }

      // Verify membership before saving
      db.get(
        'SELECT 1 FROM members WHERE conversation_id = ? AND user_id = ?',
        [conversationId, senderId],
        (err, member) => {
          if (err || !member) {
            if (callback) callback({ error: 'Not a member' });
            return;
          }

          db.run(
            'INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)',
            [conversationId, senderId, body.trim()],
            function (err) {
              if (err) {
                if (callback) callback({ error: 'Failed to send' });
                return;
              }

              const messageId = this.lastID;
              const message = {
                id: messageId,
                conversation_id: conversationId,
                sender_id: senderId,
                sender_username: socket.username,
                body: body.trim(),
                created_at: new Date().toISOString(),
                read_at: null,
              };

              // Broadcast to everyone in the conversation room
              io.to(`conv_${conversationId}`).emit('receive_message', message);

              if (callback) callback({ success: true, message });
            }
          );
        }
      );
    });

    // Mark messages as read and notify the room (read receipts)
    socket.on('mark_read', (conversationId) => {
      const userId = socket.userId;
      db.run(
        `UPDATE messages SET read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`,
        [conversationId, userId]
      );
      io.to(`conv_${conversationId}`).emit('message_read', { conversationId, userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        socket.broadcast.emit('user_offline', { userId: user.userId });
        onlineUsers.delete(socket.id);
      }
    });
  });
}

module.exports = { initSocket, onlineUsers };
