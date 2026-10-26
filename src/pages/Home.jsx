import React from 'react';
import { LogIn, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import imagens
import LogoPulso from '../assets/SejaPulsoLogo.png'; 
import HeroImage from '../assets/HeroImage.jpg';

export const HomePage = () => {
  return (
    <div className="h-screen w-screen bg-[#0B132B] text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#00F5D4] selection:text-black">
      
      {/* 1. Header / Navbar Superior */}
      <header className="w-full px-6 md:px-12 pt-4 pb-2 flex items-center justify-between z-20 shrink-0">
        {/* Logo SEJAPULSO com 180px */}
        <Link to="/" className="flex items-center">
          <img
            src={LogoPulso}
            alt="Logo SejaPulso"
            className="w-[180px] h-[180px] object-contain transition-transform hover:scale-105 -my-8 pointer-events-auto" 
          />
        </Link>

        {/* Ações do Canto Superior Direito */}
        <div className="flex items-center space-x-3 md:space-x-4 z-30">
          <Link
            to="/login"
            className="flex items-center space-x-2 bg-transparent hover:bg-[#111D3A] border border-[#1E2D50] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all hover:border-[#00F5D4]"
          >
            <LogIn className="w-4 h-4 text-[#00F5D4]" />
            <span>Login</span>
          </Link>

          <a
            href="https://pulso-tech-fawn.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] px-4 py-2 rounded-full transition-colors font-bold text-xs uppercase tracking-wider"
          >
            <span>PULSE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* 2. Hero Section Central (Card Amplo e Imagem Destacada) */}
      <main className="relative flex-1 flex items-center justify-center px-4 my-auto min-h-0">
        
        {/* Texto Gigante de Fundo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <h1 className="text-[12vw] font-black leading-none tracking-tighter uppercase text-center text-white/90 whitespace-nowrap drop-shadow-2xl font-sans">
            SEJA PULSO
          </h1>
        </div>

        {/* Card Central Amplo da Imagem do Grupo */}
        <div className="relative z-10 h-[62vh] max-h-[580px] w-auto aspect-[4/3] max-w-[90vw] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#00F5D4]/20 transition-transform duration-500 hover:scale-[1.01]">
          <img
            src={HeroImage}
            alt="Grupo de Afiliados SejaPulso"
            className="w-full h-full object-cover"
          />

          {/* Badge flutuante limpa e sutil no canto da imagem */}
          <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center space-x-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-[#00F5D4] animate-pulse"></span>
            <span className="text-white text-[11px] font-semibold tracking-wide">Comunidade SejaPulso</span>
          </div>
        </div>

      </main>

      {/* 3. Footer */}
      <footer className="w-full px-6 md:px-12 pb-6 pt-2 z-20 flex justify-between items-end shrink-0">
        <div className="max-w-md">
          <p className="text-xs sm:text-sm font-medium text-gray-200 leading-snug">
            Onde a sua criatividade pulsa a favor do cliente.
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Transformando conexão e recomendação em serviço de alto valor.
          </p>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-gray-400 uppercase tracking-widest">
          <span>PULSO TECH ECOSYSTEM</span>
        </div>
      </footer>

    </div>
  );
};