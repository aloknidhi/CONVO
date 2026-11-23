/**
 * components/LoginForm.jsx - Login / Sign-up form for CONVO
 * Renders toggleable login and registration forms with glossy UI and animations.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ username: form.email, password: form.password });
      } else {
        await register({ username: form.username, email: form.email, password: form.password });
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 app-bg">
      <div className="w-full max-w-md space-y-6 px-4">
        {/* Brand header with animation */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold mb-4 shadow-lg animate-pulse-glow mx-auto">
            C
          </div>
          <h1 className="text-3xl font-bold text-blue-600 tracking-tight">CONVO</h1>
          <p className="text-gray-500 text-sm mt-2">Real-time messaging</p>
        </div>

        {/* Auth card - glossy */}
        <div className="auth-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          {error && (
            <div className="form-error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="relative">
                  <input
                    name="username"
                    placeholder="Username"
                    className="input-field pl-10"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</div>
                </div>
                <div className="relative">
                  <input
                    name="email"
                    placeholder="Email"
                    type="email"
                    className="input-field pl-10"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉️</div>
                </div>
              </>
            )}
            {mode !== 'register' && (
              <div className="relative">
                <input
                  name="email"
                  placeholder="Username or email"
                  className="input-field pl-10"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</div>
              </div>
            )}
            <div className="relative">
              <input
                name="password"
                placeholder="Password"
                type="password"
                className="input-field pl-10"
                value={form.password}
                onChange={handleChange}
                required
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-blue-600 font-semibold underline hover:text-blue-700 transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
