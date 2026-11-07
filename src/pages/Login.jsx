import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, setAuthSession } from '../services/api';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });

      // 🔒 1. Armazena o token e usuário EXCLUSIVAMENTE em memória (Sem localStorage)
      setAuthSession(data.accessToken, data.user);

      // 2. Notifica o estado do App
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      // 3. Redirecionamento baseado no perfil (Role)
      if (data.user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Credenciais inválidas ou erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4 font-sans text-white">
      <form 
        onSubmit={handleSubmit} 
        className="bg-[#1C2541] p-8 rounded-2xl max-w-md w-full border border-slate-800 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Painel do Afiliado <span className="text-[#00F5D4]">SejaPulso</span>
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-slate-400 text-sm mb-2">E-mail corporativo (CNPJ)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0B132B] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#00F5D4]"
            placeholder="admin@pulsotech.com.br"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-slate-400 text-sm mb-2">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0B132B] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#00F5D4]"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00F5D4] text-[#0B132B] font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Autenticando...' : 'Acessar Plataforma'}
        </button>
      </form>
    </div>
  );
};