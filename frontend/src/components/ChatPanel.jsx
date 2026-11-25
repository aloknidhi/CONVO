// components/ChatPanel.jsx - Main chat conversation panel for CONVO
// Shows message history, real-time incoming messages via Socket.io,
// and a composer to send new messages.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { getSocket } from '../utils/socket';
import MessageBubble from './MessageBubble';

export default function ChatPanel({ conversation }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, [conversation?.id]);

  async function loadMessages() {
    if (!conversation?.id) return;
    setLoading(true);
    try {
      const data = await api.getMessages(conversation.id);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }

  // Connect socket and join conversation room
  useEffect(() => {
    if (!token || !conversation?.id) return;

    // Clean up previous socket listeners
    if (socketRef.current) {
      socketRef.current.off('receive_message');
      socketRef.current.off('connect');
    }

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_conversation', conversation.id);
    });

    socket.on('receive_message', (msg) => {
      if (msg.conversation_id == conversation.id) {
        setMessages((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
    });

    return () => {
      socket.off('receive_message');
      socket.emit('leave_conversation', conversation.id);
    };
  }, [token, conversation?.id]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !conversation?.id) return;

    setSending(true);
    try {
      const data = await api.sendMessage(conversation.id, input);
      const sent = data && data.message ? data.message : null;
      setInput('');
      if (sent) {
        // Show the sent message immediately (optimistic). Dedupe by id so the
        // Socket.io echo doesn't create a duplicate bubble.
        setMessages((prev) => (prev.find((m) => m.id === sent.id) ? prev : [...prev, sent]));
      }
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
          {conversation.is_group ? 'G' : (conversation.other_username || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-gray-900">
            {conversation.is_group ? (conversation.name || 'Group') : conversation.other_username || 'Unknown'}
          </div>
          <div className="text-xs text-gray-500">
            {conversation.is_group ? 'Group chat' : 'Direct message'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-gray-400 text-sm mt-10">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} currentUserId={user?.id} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-field flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn-primary px-4"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
