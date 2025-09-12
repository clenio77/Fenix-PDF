'use client';

import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  documentsCount: number;
}

export default function Header({ documentsCount }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header 
      className="bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800 backdrop-blur-xl border-b border-gray-700 sticky top-0 z-50 shadow-2xl relative overflow-hidden"
      role="banner"
      aria-label="Cabeçalho principal do Fênix PDF"
    >
      <div className="container-responsive relative z-10">
        <div className="flex items-center justify-between py-3">
          {/* Título */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Fênix PDF
              </h1>
              <p className="text-xs text-gray-300 font-medium hidden sm:block">Editor de PDF Profissional</p>
            </div>
          </div>

          {/* Status e Informações */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sistema Online</span>
            </div>
            <div className="text-sm text-gray-400">
              {documentsCount} documento{documentsCount !== 1 ? 's' : ''} carregado{documentsCount !== 1 ? 's' : ''}
            </div>
            <ThemeToggle />
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-blue-500 transition-colors"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {isMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden border-t border-gray-600 py-4"
            role="navigation"
            aria-label="Menu de navegação mobile"
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Sistema Online</span>
              </div>
              <div className="text-sm text-gray-400">
                {documentsCount} documento{documentsCount !== 1 ? 's' : ''} carregado{documentsCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}