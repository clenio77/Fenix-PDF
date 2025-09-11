'use client';

import { useState } from 'react';
import { PDFDocument } from '../lib/types';
import { PDFService } from '../lib/pdfService';

interface FileListProps {
  documents: PDFDocument[];
  selectedPageIndex: number | null;
  onSelectPage: (index: number) => void;
  onDocumentsUpdate: (documents: PDFDocument[]) => void;
}

export default function FileList({ documents, selectedPageIndex, onSelectPage, onDocumentsUpdate }: FileListProps) {
  const [draggedPage, setDraggedPage] = useState<{docIndex: number, pageIndex: number} | null>(null);
  const [hoveredPage, setHoveredPage] = useState<{docIndex: number, pageIndex: number} | null>(null);

  // Função para iniciar o arrastar
  const handleDragStart = (docIndex: number, pageIndex: number) => {
    setDraggedPage({ docIndex, pageIndex });
  };

  // Função para permitir o soltar
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Função para quando soltar o item
  const handleDrop = (targetDocIndex: number, targetPageIndex: number) => {
    if (!draggedPage) return;

    const { docIndex: sourceDocIndex, pageIndex: sourcePageIndex } = draggedPage;
    
    if (sourceDocIndex === targetDocIndex) {
      // Reordenar páginas dentro do mesmo documento
      const updatedDocuments = [...documents];
      const document = updatedDocuments[sourceDocIndex];
      const updatedDocument = PDFService.reorderPages(document, sourcePageIndex, targetPageIndex);
      updatedDocuments[sourceDocIndex] = updatedDocument;
      onDocumentsUpdate(updatedDocuments);
    } else {
      // Mover página entre documentos
      const updatedDocuments = [...documents];
      const sourceDocument = updatedDocuments[sourceDocIndex];
      const targetDocument = updatedDocuments[targetDocIndex];
      
      const { sourceDocument: updatedSource, targetDocument: updatedTarget } = PDFService.movePageBetweenDocuments(
        sourceDocument,
        targetDocument,
        sourcePageIndex,
        targetPageIndex
      );
      
      updatedDocuments[sourceDocIndex] = updatedSource;
      updatedDocuments[targetDocIndex] = updatedTarget;
      onDocumentsUpdate(updatedDocuments);
    }

    setDraggedPage(null);
  };

  // Função para rotacionar uma página
  const handleRotate = (docIndex: number, pageIndex: number) => {
    const updatedDocuments = [...documents];
    const document = updatedDocuments[docIndex];
    const updatedDocument = PDFService.rotatePage(document, pageIndex, 90);
    updatedDocuments[docIndex] = updatedDocument;
    onDocumentsUpdate(updatedDocuments);
  };

  // Função para deletar uma página
  const handleDelete = (docIndex: number, pageIndex: number) => {
    if (confirm('Tem certeza que deseja excluir esta página?')) {
      const updatedDocuments = [...documents];
      const document = updatedDocuments[docIndex];
      const updatedDocument = PDFService.removePage(document, pageIndex);
      updatedDocuments[docIndex] = updatedDocument;
      onDocumentsUpdate(updatedDocuments);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center p-4 border border-gray-200 rounded-lg">
        <p className="text-gray-500">Nenhum documento carregado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Documentos</h3>
      
      {documents.map((doc, docIndex) => (
        <div key={doc.id} className="border border-gray-200 rounded-lg p-2">
          <h4 className="font-medium truncate mb-2">{doc.name}</h4>
          
          <div className="grid grid-cols-2 gap-2">
            {doc.pages.map((page, pageIndex) => {
              // Calcular o índice global da página
              let globalPageIndex = 0;
              for (let i = 0; i < docIndex; i++) {
                globalPageIndex += documents[i].pages.length;
              }
              globalPageIndex += pageIndex;
              
              const isHovered = hoveredPage?.docIndex === docIndex && hoveredPage?.pageIndex === pageIndex;
              const isSelected = selectedPageIndex === globalPageIndex;
              
              return (
                <div 
                  key={`${doc.id}-page-${pageIndex}`}
                  className={`relative border rounded-md p-1 cursor-pointer group transition-all ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onClick={() => onSelectPage(globalPageIndex)}
                  draggable
                  onDragStart={() => handleDragStart(docIndex, pageIndex)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(docIndex, pageIndex)}
                  onMouseEnter={() => setHoveredPage({ docIndex, pageIndex })}
                  onMouseLeave={() => setHoveredPage(null)}
                >
                  <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {/* Miniatura da página */}
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <span className="text-xs text-gray-500">Página {pageIndex + 1}</span>
                    </div>
                    
                    {/* Indicador de rotação */}
                    {page.rotation !== 0 && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                        {page.rotation}°
                      </div>
                    )}
                  </div>
                  
                  {/* Botões de ação - aparecem no hover */}
                  {(isHovered || isSelected) && (
                    <div className="absolute top-1 right-1 flex space-x-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRotate(docIndex, pageIndex); }}
                        className="bg-white p-1 rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                        title="Rotacionar 90°"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(docIndex, pageIndex); }}
                        className="bg-white p-1 rounded-full shadow-sm hover:bg-red-100 transition-colors"
                        title="Excluir página"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Indicador de anotações */}
                  {page.textAnnotations.length > 0 && (
                    <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                      {page.textAnnotations.length} anotação{page.textAnnotations.length > 1 ? 'ões' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}