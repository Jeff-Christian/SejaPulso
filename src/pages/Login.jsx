import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Chamada para a API backend do SejaPulso
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao autenticar.');
      }

      // Salvar sessão e redirecionar
      localStorage.setItem('@SejaPulso:token', data.token);
      localStorage.setItem('@SejaPulso:user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-white flex flex-col justify-between px-4 py-8 relative font-sans">
      
      <div className="max-w-md w-full mx-auto">
        <Link to="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-[#00F5D4] text-xs font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-wide uppercase">
            SEJA<span className="text-[#00F5D4]">PULSO</span>
          </h1>
          <p className="text-gray-400 text-xs mt-2">
            Insira suas credenciais cadastradas para acessar o painel
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-2">
              E-mail de Afiliado
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="afiliado@pulsotech.com"
                required
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#00F5D4] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-300 uppercase">
                Senha
              </label>
              <a href="#" className="text-xs text-[#00F5D4] hover:underline">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#00F5D4] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all transform active:scale-95 mt-6 disabled:opacity-50"
          >
            <span>{loading ? 'Autenticando...' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 p-4 bg-[#0B132B] rounded-lg border border-[#1E2D50] text-center text-xs text-gray-400">
          Acesso exclusivo para afiliados aprovados com CNPJ Ativo.
        </div>

      </div>

      <div className="text-center text-xs text-gray-500 font-mono">
        © Pulso Tech • Estúdio de Tecnologia Criativa
      </div>
    </div>
  );
};