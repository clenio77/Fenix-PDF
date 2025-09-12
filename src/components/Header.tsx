'use client';

import { useState } from 'react';

interface HeaderProps {
  documentsCount: number;
}

export default function Header({ documentsCount }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-2xl relative overflow-hidden">
      {/* Efeito de partículas */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
      <div className="container-responsive relative z-10">
        <div className="flex items-center justify-between py-2">
          {/* Logo e Título */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="h-16 w-auto flex items-center justify-center">
              <img 
                src="/images/logocleniopdf.svg" 
                alt="Clênio PDF Editor" 
                className="h-full w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Fênix PDF
              </h1>
              <p className="text-xs text-blue-100 font-medium hidden sm:block">Editor de PDF Profissional</p>
            </div>
          </div>

          {/* Status e Informações */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-blue-100">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <span>Sistema Online</span>
            </div>
            <div className="text-sm text-blue-200">
              {documentsCount} documento{documentsCount !== 1 ? 's' : ''} carregado{documentsCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-blue-500 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-600 py-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Sistema Online</span>
              </div>
              <div className="text-sm text-slate-400">
                {documentsCount} documento{documentsCount !== 1 ? 's' : ''} carregado{documentsCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}