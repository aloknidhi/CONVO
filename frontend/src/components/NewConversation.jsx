/**
 * components/NewConversation.jsx - Modal to start a new direct or group chat
 * Lists users to select from and creates the conversation.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function NewConversation({ onCreate, onClose }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => {
    loadUsers();
  }, [user]);

  async function loadUsers() {
    try {
      const data = await api.getUsers(search);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  function toggleUser(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function createConv(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (selected.length === 1) {
        const data = await api.createDirect(selected[0]);
        onCreate(data.conversation);
      } else if (selected.length > 1) {
        if (!name) {
          setError('Group name is required');
          return;
        }
        const data = await api.createGroup(name, selected);
        onCreate(data.conversation);
      } else {
        setError('Please select at least one user');
        return;
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">New Conversation</h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="input-field"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1 mb-4">
          {users.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-sm">No users found</div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${selected.includes(u.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u.username}</div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                </div>
                {selected.includes(u.id) && (
                  <span className="text-blue-600 text-xs font-medium">✓</span>
                )}
              </div>
            ))
          )}
        </div>

        {selected.length > 1 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Group name</label>
            <input
              type="text"
              placeholder="Enter group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button
            onClick={createConv}
            disabled={loading || selected.length === 0}
            className="btn-primary flex-1"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
