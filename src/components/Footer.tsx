'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container-responsive">
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo e Descrição */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/images/logoclenio.svg" 
                    alt="Clênio Consultory AI" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Fênix PDF
                  </h3>
                  <p className="text-sm text-gray-600">Powered by Clênio Consultory AI</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Ferramenta interna desenvolvida para simplificar e centralizar a manipulação de documentos PDF. 
                Permite upload, visualização, edição de texto, reorganização de páginas e merge de múltiplos PDFs.
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Sistema Online • Versão 1.0.0</span>
              </div>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Upload de PDFs
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Edição de Texto
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Reorganização
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Merge de PDFs
                </li>
              </ul>
            </div>

            {/* Suporte */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Documentação
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Tutorial
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Linha Divisória */}
          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-500">
                © {currentYear} Fênix PDF. Todos os direitos reservados.
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Desenvolvido por</span>
                <span className="font-semibold text-blue-600">Clênio Consultory AI</span>
                <span>para Correios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}