import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/Home';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { DashboardPage } from './pages/Dashboard';
import { apiRequest, clearAuthSession } from './services/api';

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
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (!token || !savedUser) {
          setUser(null);
          return;
        }

        // Restaura a instância do usuário se a chave estiver presente
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.warn("Sessão expirada ou não autorizada. Limpando credenciais...");
        clearAuthSession();
        setUser(null);
      } finally {
        // Encerra a tela de carregamento independente do resultado
        setCheckingAuth(false);
      }
    };

    verifySession();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0B132B] flex items-center justify-center text-gray-400 font-mono text-xs">
        Carregando sessão segura...
      </div>
    );
  }

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