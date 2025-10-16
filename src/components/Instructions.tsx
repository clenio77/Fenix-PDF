'use client';

interface InstructionsProps {
  documentsCount: number;
  selectedPageIndex: number | null;
}

export default function Instructions({ documentsCount, selectedPageIndex }: InstructionsProps) {
  if (documentsCount === 0) {
    return (
      <div className="card fade-in-up border-2 border-blue-400 bg-blue-50/10">
        <div className="card-header">
          <h3 className="text-base font-semibold text-white flex items-center">
            <span className="text-lg mr-2">🚀</span>
            Como Começar
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Faça Upload dos PDFs</h4>
                <p className="text-xs text-white/70">
                  Use a área de upload no sidebar esquerdo para carregar seus arquivos PDF
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Selecione uma Página</h4>
                <p className="text-xs text-white/70">
                  Clique em uma página na lista de documentos para visualizá-la
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Use as Ferramentas</h4>
                <p className="text-xs text-white/70">
                  Escolha uma ferramenta no sidebar para editar, adicionar texto ou analisar o PDF
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPageIndex === null) {
    return (
      <div className="card fade-in-up border-2 border-yellow-400 bg-yellow-50/10">
        <div className="card-header">
          <h3 className="text-base font-semibold text-white flex items-center">
            <span className="text-lg mr-2">👆</span>
            Selecione uma Página
          </h3>
        </div>
        <div className="card-body">
          <div className="text-center py-4">
            <svg className="w-12 h-12 text-yellow-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <p className="text-white text-sm mb-2">
              Você tem {documentsCount} documento{documentsCount !== 1 ? 's' : ''} carregado{documentsCount !== 1 ? 's' : ''}
            </p>
            <p className="text-white/70 text-xs">
              Clique em uma página na lista de documentos no sidebar para começar a visualizar e editar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in-up border-2 border-green-400 bg-green-50/10">
      <div className="card-header">
        <h3 className="text-base font-semibold text-white flex items-center">
          <span className="text-lg mr-2">✅</span>
          Pronto para Editar
        </h3>
      </div>
      <div className="card-body">
        <div className="text-center py-4">
          <svg className="w-12 h-12 text-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-white text-sm mb-2">
            Página selecionada e pronta para edição
          </p>
          <p className="text-white/70 text-xs">
            Use as ferramentas no sidebar para editar, adicionar texto ou analisar o PDF
          </p>
        </div>
      </div>
    </div>
  );
}
