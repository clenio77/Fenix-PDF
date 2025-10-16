'use client';

import { useState } from 'react';
import { PDFDocument } from '../lib/types';
import { NotificationService } from '../lib/notifications';
import { PDFService } from '../lib/pdfService';
import CompressionStats from './CompressionStats';
import FileUploadCompact from './FileUploadCompact';
import CompressionModal from './CompressionModal';

interface SidebarProps {
  documents: PDFDocument[];
  currentTool: string;
  selectedPageIndex: number | null;
  onToolChange: (tool: string) => void;
  onDocumentsUpdate: (documents: PDFDocument[]) => void;
  onSelectPage: (pageIndex: number | null) => void;
  onFilesUploaded: (documents: PDFDocument[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  documents,
  currentTool,
  selectedPageIndex,
  onToolChange,
  onDocumentsUpdate,
  onSelectPage,
  onFilesUploaded,
  isOpen,
  onToggle
}: SidebarProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalDocuments, setOriginalDocuments] = useState<PDFDocument[]>([]);
  const [showCompressionModal, setShowCompressionModal] = useState(false);

  const tools = [
    { 
      id: 'select', 
      name: 'Selecionar', 
      icon: 'M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11',
      description: 'Selecionar e editar anotações',
      color: 'text-blue-500'
    },
    { 
      id: 'text', 
      name: 'Adicionar Texto', 
      icon: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18 9l-4-4m0 0L8 9m6-4v12',
      description: 'Adicionar nova anotação de texto',
      color: 'text-green-500'
    },
    { 
      id: 'edit', 
      name: 'Editar Texto', 
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      description: 'Editar texto existente no PDF',
      color: 'text-purple-500'
    },
    { 
      id: 'search-edit', 
      name: 'Buscar e Editar', 
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      description: 'Buscar texto específico e editá-lo',
      color: 'text-orange-500'
    },
    { 
      id: 'analyze', 
      name: 'Analisar PDF', 
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      description: 'Analisar estrutura do PDF',
      color: 'text-red-500'
    },
  ];

  const handleCompressPDFs = () => {
    if (documents.length === 0) {
      NotificationService.warning('Nenhum documento carregado para comprimir.');
      return;
    }
    setShowCompressionModal(true);
  };

  const handleCompressionConfirm = async (quality: number, compressionLevel: string) => {
    setIsCompressing(true);
    // Salvar documentos originais para comparação
    setOriginalDocuments([...documents]);
    const loadingToastId = NotificationService.loading(`Comprimindo PDFs com ${compressionLevel} compressão...`);

    try {
      const compressedDocuments: PDFDocument[] = [];

      for (const document of documents) {
        const compressedDocument = await PDFService.compressPDF(document, quality);
        compressedDocuments.push(compressedDocument);
      }

      onDocumentsUpdate(compressedDocuments);
      
      // Calcular estatísticas de compressão
      const originalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
      const compressedSize = compressedDocuments.reduce((sum, doc) => sum + doc.size, 0);
      const compressionData = PDFService.calculateCompressionRatio(originalSize, compressedSize);
      
      NotificationService.updateSuccess(
        loadingToastId, 
        `PDFs comprimidos com sucesso! ${compressionData.percentage.toFixed(1)}% de redução (${(compressionData.savedBytes / 1024 / 1024).toFixed(2)} MB economizados).`
      );
    } catch (error) {
      console.error('Erro ao comprimir PDFs:', error);
      NotificationService.updateError(loadingToastId, 'Erro ao comprimir PDFs. Tente novamente.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownloadCompressed = async () => {
    if (documents.length === 0) {
      NotificationService.warning('Nenhum documento carregado.');
      return;
    }

    const loadingToastId = NotificationService.loading('Gerando PDF comprimido...');

    try {
      const blob = await PDFService.generatePDF(documents);
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `documentos-comprimidos-${timestamp}.pdf`;
      
      PDFService.downloadPDF(blob, filename);
      NotificationService.updateSuccess(loadingToastId, `PDF comprimido gerado com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar PDF comprimido:', error);
      NotificationService.updateError(loadingToastId, 'Erro ao gerar PDF comprimido.');
    }
  };

  const totalPages = documents.reduce((sum, doc) => sum + doc.pages.length, 0);
  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static top-0 left-0 h-full w-80 bg-gradient-to-b from-slate-800 via-gray-900 to-slate-800 border-r border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header do Sidebar */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Ferramentas</h2>
              <button
                onClick={onToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
                aria-label="Fechar sidebar"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Conteúdo do Sidebar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Seção de Upload */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                Upload de Arquivos
              </h3>
              <FileUploadCompact onFilesUploaded={onFilesUploaded} />
            </div>

            {/* Seção de Ferramentas */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                Ferramentas de Edição
              </h3>
              <div className="space-y-2">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      currentTool === tool.id 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    onClick={() => onToolChange(tool.id)}
                    title={tool.description}
                  >
                    <svg className={`w-5 h-5 ${currentTool === tool.id ? 'text-white' : tool.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                    </svg>
                    <div className="text-left">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs opacity-75">{tool.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Seção de Documentos */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                Documentos ({documents.length})
              </h3>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc, docIndex) => (
                    <div key={doc.id} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-white truncate">{doc.name}</h4>
                        <span className="text-xs text-gray-400">{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {doc.pages.length} página{doc.pages.length !== 1 ? 's' : ''}
                      </div>
                      <div className="space-y-1">
                        {doc.pages.map((page, pageIndex) => {
                          const globalPageIndex = documents.slice(0, docIndex).reduce((sum, d) => sum + d.pages.length, 0) + pageIndex;
                          return (
                            <button
                              key={page.id}
                              className={`w-full text-left p-2 rounded text-xs transition-colors ${
                                selectedPageIndex === globalPageIndex
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                              }`}
                              onClick={() => onSelectPage(globalPageIndex)}
                            >
                              Página {pageIndex + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {/* Estatísticas */}
                  <div className="bg-gray-800 rounded-lg p-3 mt-3">
                    <h4 className="text-sm font-medium text-white mb-2">Estatísticas</h4>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Total de páginas:</span>
                        <span className="text-white">{totalPages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tamanho total:</span>
                        <span className="text-white">{(totalSize / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400 text-sm">Nenhum documento carregado</p>
                </div>
              )}
            </div>

            {/* Seção de Ações */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                Ações
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleCompressPDFs}
                  disabled={documents.length === 0 || isCompressing}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <span>{isCompressing ? 'Comprimindo...' : 'Comprimir PDFs'}</span>
                </button>

                <button
                  onClick={handleDownloadCompressed}
                  disabled={documents.length === 0}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Baixar PDF Comprimido</span>
                </button>
              </div>
            </div>

            {/* Estatísticas de Compressão */}
            {originalDocuments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                  Estatísticas
                </h3>
                <CompressionStats 
                  documents={originalDocuments} 
                  compressedDocuments={documents} 
                />
              </div>
            )}
          </div>

          {/* Footer do Sidebar */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              <p>Fênix PDF v1.0</p>
              <p>Editor Profissional</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Modal de Configuração de Compressão */}
      <CompressionModal
        isOpen={showCompressionModal}
        onClose={() => setShowCompressionModal(false)}
        onConfirm={handleCompressionConfirm}
        documentCount={documents.length}
      />
    </>
  );
}
