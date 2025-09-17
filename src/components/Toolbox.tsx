'use client';

interface ToolboxProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
}

export default function Toolbox({ currentTool, onToolChange }: ToolboxProps) {
  const tools = [
    { 
      id: 'select', 
      name: 'Selecionar', 
      icon: 'M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11',
      description: 'Selecionar e editar anotações'
    },
    { 
      id: 'text', 
      name: 'Adicionar Texto', 
      icon: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18 9l-4-4m0 0L8 9m6-4v12',
      description: 'Adicionar nova anotação de texto'
    },
    { 
      id: 'edit', 
      name: 'Editar Texto', 
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      description: 'Editar texto existente no PDF (modo inteligente)'
    },
    { 
      id: 'search-edit', 
      name: 'Buscar e Editar', 
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      description: 'Buscar texto específico e editá-lo'
    },
    { 
      id: 'analyze', 
      name: 'Analisar PDF', 
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      description: 'Analisar estrutura do PDF'
    },
  ];

  return (
    <div className="space-y-4" role="toolbar" aria-label="Ferramentas de edição">
      <div className="flex flex-wrap gap-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`toolbox-btn flex items-center space-x-2 ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={tool.description}
            aria-label={tool.description}
            aria-pressed={currentTool === tool.id}
            role="button"
            tabIndex={0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
            </svg>
            <span className="text-sm font-medium">{tool.name}</span>
          </button>
        ))}
      </div>
      
      {/* Instruções de uso */}
      <div className="text-sm text-white/70">
        {currentTool === 'select' && (
          <p>Clique em uma anotação para editá-la ou excluí-la.</p>
        )}
        {currentTool === 'text' && (
          <p>Clique em qualquer lugar da página para adicionar uma nova anotação de texto.</p>
        )}
        {currentTool === 'edit' && (
          <p>Clique diretamente no texto do PDF para editá-lo com o editor inteligente.</p>
        )}
        {currentTool === 'search-edit' && (
          <p>Busque um texto específico no PDF e substitua-o por outro texto.</p>
        )}
        {currentTool === 'analyze' && (
          <p>Analise a estrutura do PDF para obter informações sobre formatação e texto.</p>
        )}
      </div>
    </div>
  );
}