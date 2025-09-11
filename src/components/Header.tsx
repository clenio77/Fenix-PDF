'use client';

import { useState } from 'react';

interface HeaderProps {
  documentsCount: number;
}

export default function Header({ documentsCount }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 backdrop-blur-md border-b border-slate-600 sticky top-0 z-50 shadow-lg">
      <div className="container-responsive">
        <div className="flex items-center justify-between py-4">
          {/* Logo e Título */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="/images/logocleniopdf.svg" 
                alt="Clênio PDF Editor" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Fênix PDF
              </h1>
              <p className="text-xs text-slate-300 font-medium">Ferramenta Interna de Edição</p>
            </div>
          </div>

          {/* Status e Informações */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sistema Online</span>
            </div>
            <div className="text-sm text-slate-400">
              {documentsCount} documento{documentsCount !== 1 ? 's' : ''} carregado{documentsCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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