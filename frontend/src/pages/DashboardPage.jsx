// pages/DashboardPage.jsx - Main dashboard for CONVO
// Layout: sidebar with conversation list + chat panel for active conversation.
// Includes "New conversation" button to start direct or group chats.

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import NewConversation from '../components/NewConversation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeConversation, setActiveConversation] = useState(null);
  const [showNewConv, setShowNewConv] = useState(false);

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Header (mobile only) */}
      <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 lg:hidden">
        <div className="text-xl font-bold text-blue-600">CONVO</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewConv(true)}
            className="text-gray-600 hover:text-blue-600"
          >
            + New
          </button>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar (hidden on mobile by default) */}
      <aside className="hidden lg:flex lg:w-80 flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="text-xl font-bold text-blue-600 tracking-tight">CONVO</div>
          <div className="text-xs text-gray-400 mt-1">Real-time messaging</div>
        </div>
        <Sidebar
          onConversationSelect={setActiveConversation}
          activeConversationId={activeConversation?.id}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-2xl font-bold text-blue-600 mb-2">CONVO</div>
            <p className="text-sm">Select a conversation to start chatting</p>
            <button
              onClick={() => setShowNewConv(true)}
              className="mt-6 btn-primary"
            >
              Start new conversation
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
              <div className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="text-gray-400 hover:text-gray-600 lg:hidden"
                >
                  ←
                </button>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {activeConversation.is_group ? 'G' : (activeConversation.other_username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {activeConversation.is_group ? (activeConversation.name || 'Group') : activeConversation.other_username || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activeConversation.is_group ? 'Group chat' : 'Direct message'}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </header>
            <ChatPanel conversation={activeConversation} />
          </div>
        )}

        {showNewConv && (
          <NewConversation
            onCreate={(conv) => {
              setActiveConversation(conv);
              setShowNewConv(false);
            }}
            onClose={() => setShowNewConv(false)}
          />
        )}
      </main>
    </div>
  );
}
