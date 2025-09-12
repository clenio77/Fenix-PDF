'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 mt-auto">
      <div className="container-responsive">
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Logo e Título */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src="/images/logoclenio.svg" 
                  alt="Clênio Consultory AI" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Fênix PDF
                </h3>
                <p className="text-xs text-white/60">Powered by Clênio Consultory AI</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2 text-xs text-white/60">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sistema Online • Versão 1.0.0</span>
            </div>

            {/* Copyright */}
            <div className="text-xs text-white/60">
              © {currentYear} Fênix PDF. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}