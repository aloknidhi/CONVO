# CONVO - Real-time Chat Application

CONVO is a full-stack real-time messaging application built with:

- **Backend:** Node.js, Express, Socket.io, SQLite (SQL database)
- **Frontend:** React 18, Vite, Tailwind CSS, Socket.io-client
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing

## Features

- User registration & login with JWT sessions
- Direct (1-on-1) messaging
- Group chat creation with multiple members
- Real-time message delivery via WebSockets (Socket.io)
- Conversation list with unread indicators
- Message history with pagination
- Online/offline user presence
- Responsive UI with Tailwind CSS

## Project Structure

```
CONVO/
├── backend/
│   ├── server.js           # Express app + HTTP server entry point
│   ├── db.js               # SQLite schema initialization & connection
│   ├── routes/
│   │   ├── auth.js         # Register / login endpoints
│   │   ├── users.js        # User lookup endpoints
│   │   ├── conversations.js# Create / list conversations
│   │   └── messages.js     # Send / fetch messages
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   └── socket/
│       └── chat.js         # Socket.io real-time event handlers
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # React router setup
│   │   ├── main.jsx        # React entry point
│   │   ├── index.css       # Tailwind + custom styles
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state provider
│   │   ├── utils/
│   │   │   ├── api.js      # REST API fetch wrapper
│   │   │   └── socket.js   # Socket.io client helper
│   │   ├── components/
│   │   │   ├── LoginForm.jsx         # Login / signup form
│   │   │   ├── Sidebar.jsx           # Conversation list
│   │   │   ├── ChatPanel.jsx         # Active chat window
│   │   │   ├── MessageBubble.jsx     # Individual message
│   │   │   └── NewConversation.jsx   # New chat modal
│   │   └── pages/
│   │       ├── LoginPage.jsx         # Public login page
│   │       └── DashboardPage.jsx     # Main chat dashboard
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js v18+
- npm

### Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

Then open `http://localhost:5173` in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login and get JWT |
| GET | /api/users | List/search users |
| GET | /api/conversations | List user conversations |
| POST | /api/conversations/direct | Create direct chat |
| POST | /api/conversations/group | Create group chat |
| GET | /api/messages/:id | Get messages for a conversation |
| POST | /api/messages | Send a new message |

## License

MIT
