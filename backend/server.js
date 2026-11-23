// server.js - Entry point for the CONVO chat backend
// Sets up Express, mounts API routes, initializes Socket.io, and starts the HTTP server.

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { initSchema, db } = require('./db');
const { initSocket } = require('./socket/chat');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app so route handlers can access it if needed
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'convo-backend' });
});

// Initialize database and Socket.io, then start listening
const PORT = process.env.PORT || 5000;

initSchema()
  .then(() => {
    initSocket(io);

    server.listen(PORT, () => {
      console.log(`CONVO backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Graceful shutdown
// sql.js Database.close() is synchronous and takes no callback
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  if (db) db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  if (db) db.close();
  process.exit(0);
});

module.exports = { app, server, io };
