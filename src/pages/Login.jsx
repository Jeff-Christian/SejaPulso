import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 1. Importa o hook de navegação
import { apiRequest } from '../services/api';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate(); // 👈 2. Instancia o roteador

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 [Login.jsx] Botão Clicado. Iniciando autenticação para:', email);
    
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      
      console.log('✅ [Login.jsx] Autenticação realizada com sucesso:', data);

      // 1. Grava no navegador
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 2. Avisa o App.jsx
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      // 3. 🚀 AQUI ESTÁ O DIRECCIONAMENTO QUE FALTAVA:
      if (data.user.role === 'ADMIN') {
        console.log('🔀 Redirecionando para o Painel do Administrador (/admin)...');
        navigate('/admin', { replace: true });
      } else {
        console.log('🔀 Redirecionando para a Dashboard do Afiliado (/dashboard)...');
        navigate('/dashboard', { replace: true });
      }

    } catch (err) {
      console.error('❌ [Login.jsx] Erro capturado no catch:', err);
      setError(err.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4 font-sans">
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