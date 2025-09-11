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
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-lg mb-3">Ferramentas</h3>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`toolbox-btn flex items-center space-x-2 px-3 py-2 ${currentTool === tool.id ? 'bg-blue-100 border-blue-300' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={tool.description}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
            </svg>
            <span className="text-sm font-medium">{tool.name}</span>
          </button>
        ))}
      </div>
      
      {/* Instruções de uso */}
      <div className="mt-4 text-sm text-gray-600">
        {currentTool === 'select' && (
          <p>Clique em uma anotação para editá-la ou excluí-la.</p>
        )}
        {currentTool === 'text' && (
          <p>Clique em qualquer lugar da página para adicionar uma nova anotação de texto.</p>
        )}
      </div>
    </div>
  );
}