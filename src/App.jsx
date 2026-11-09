// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/Home';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { DashboardPage } from './pages/Dashboard';
import { clearAuthSession } from './services/api';

// Guard para o Painel do Administrador
const AdminRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Guard para o Painel do Afiliado Consultor
const PrivateRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

export const App = () => {
  // 🟢 Inicialização síncrona do usuário lendo o localStorage direto
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      return token && savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
            ) : (
              <Login onLoginSuccess={(userData) => setUser(userData)} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute user={user}>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute user={user}>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;