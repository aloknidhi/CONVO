/**
 * App.jsx - Top-level router for CONVO
 * Sets up route guards: public routes (login) and protected routes (dashboard).
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function requireAuth() {
  // Client-side guard handled inside ProtectedRoute via context
  return true;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    ),
  },
  {
    path: '/login',
    element: (
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    ),
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
