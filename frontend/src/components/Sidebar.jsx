// components/Sidebar.jsx - Conversation list sidebar for CONVO
// Shows all conversations the user is part of, with unread indicators.
// Clicking a conversation selects it for the chat panel.

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function Sidebar({ onConversationSelect, activeConversationId }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [user]);

  async function loadConversations() {
    setLoading(true);
    try {
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full bg-gray-900 text-white p-4 flex flex-col">
        <div className="text-xl font-bold text-blue-400 mb-6">CONVO</div>
        <div className="animate-pulse text-gray-400">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <div className="text-xl font-bold text-blue-400 tracking-tight">CONVO</div>
        <div className="text-xs text-gray-400 mt-1">Real-time chat</div>
      </div>

      <div className="p-3">
        <input
          type="text"
          placeholder="Search conversations"
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-3 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-1 space-y-1">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No conversations yet. Start a new chat!
          </div>
        ) : (
          conversations.map((conv) => {
            const isDirect = !conv.is_group;
            const displayName = isDirect
              ? conv.other_username || 'Unknown'
              : conv.name || 'Group Chat';
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onConversationSelect(conv)}
                className={`conversation-item flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900'
                    : 'hover:bg-gray-100 border-transparent text-gray-900'
                }`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0 ${
                  isDirect ? 'bg-blue-600' : 'bg-purple-600'
                }">
                  {isDirect ? displayName.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{displayName}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {isDirect ? 'Direct message' : 'Group conversation'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => {
            // Triggered by parent to start new conversation
          }}
          className="w-full py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition text-sm"
        >
          + New conversation
        </button>
      </div>
    </div>
  );
}
