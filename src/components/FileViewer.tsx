'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFDocument as PDFDocumentType } from '../lib/types';
import { NotificationService } from '../lib/notifications';
import { PDFService } from '../lib/pdfService';

// --- CORREÇÃO DO WORKER ---
// Aponta para a cópia local do worker na pasta /public
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface FileViewerProps {
  documents: PDFDocumentType[];
  currentTool: string;
  selectedPageIndex: number | null;
  onDocumentsUpdate: (documents: PDFDocumentType[]) => void;
}

export default function FileViewer({ documents, currentTool, selectedPageIndex, onDocumentsUpdate }: FileViewerProps) {
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<PDFDocumentType | null>(null);

  // Encontrar o documento atual baseado na página selecionada
  useEffect(() => {
    if (documents.length === 0) {
      setCurrentDocument(null);
      setTotalPages(0);
      setCurrentPage(1);
      setError(null);
      return;
    }

    if (selectedPageIndex !== null) {
      let pageCount = 0;
      for (const doc of documents) {
        if (selectedPageIndex >= pageCount && selectedPageIndex < pageCount + doc.pages.length) {
          setCurrentDocument(doc);
          setCurrentPage(selectedPageIndex - pageCount + 1);
          break;
        }
        pageCount += doc.pages.length;
      }
    } else if (documents.length > 0) {
      // Se não há página selecionada, selecionar o primeiro documento que ainda não foi carregado
      // ou o primeiro documento se todos já foram carregados
      const unloadedDoc = documents.find(doc => doc.pages.length === 0);
      const docToSelect = unloadedDoc || documents[0];
      setCurrentDocument(docToSelect);
      setCurrentPage(1);
    }
  }, [documents, selectedPageIndex]);

  const onDocumentLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    console.log('PDF carregado com sucesso:', {
      numPages: pdf.numPages,
      fingerprint: pdf.fingerprints?.[0],
      documentName: currentDocument?.name,
      documentSize: currentDocument?.size
    });
    
    setTotalPages(pdf.numPages);
    setError(null);
    
    if (currentDocument) {
      // Atualizar o documento com as páginas descobertas
      const updatedDocument = {
        ...currentDocument,
        pages: Array.from({ length: pdf.numPages }, (_, i) => ({
          id: `page-${currentDocument.id}-${i}`,
          index: i,
          rotation: 0,
          textAnnotations: [],
          width: 0, // Será preenchido quando a página for renderizada
          height: 0
        }))
      };
      
      // Atualizar o estado dos documentos
      const updatedDocuments = documents.map(doc => 
        doc.id === currentDocument.id ? updatedDocument : doc
      );
      
      onDocumentsUpdate(updatedDocuments);
      
      NotificationService.success(`Documento "${currentDocument.name}" carregado! ${pdf.numPages} página(s) detectada(s).`);
    }
  }, [currentDocument, documents, onDocumentsUpdate]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Falha ao carregar o PDF:', error);
    console.error('Detalhes do erro:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      documentName: currentDocument?.name,
      documentSize: currentDocument?.size
    });
    
    const message = `Falha ao carregar o documento "${currentDocument?.name}". 
    
Possíveis causas:
• Arquivo corrompido ou danificado
• Formato PDF não suportado
• PDF protegido por senha
• Problema de codificação

Detalhes técnicos: ${error.message}`;
    
    setError(message);
    NotificationService.error('Erro ao Carregar PDF');
  }, [currentDocument]);

  const changePage = (offset: number) => {
    setCurrentPage(prev => Math.max(1, Math.min(prev + offset, totalPages)));
  };

  const handleDeletePage = async () => {
    if (!currentDocument || totalPages <= 1) {
      NotificationService.error("Não é possível deletar a última página do documento");
      return;
    }

    // Confirmação antes de deletar
    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar a página ${currentPage}?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      // Mostrar loading
      NotificationService.loading("Deletando página...");

      // Deletar a página usando o PDFService
      const updatedFile = await PDFService.deletePage(currentDocument.file, currentPage - 1);

      // Criar novo documento com o arquivo atualizado, mas mantendo a estrutura das páginas
      const updatedDocument = {
        ...PDFService.createInitialDocument(updatedFile),
        // Manter as páginas existentes, mas remover a página deletada
        pages: currentDocument.pages.filter((_, index) => index !== currentPage - 1)
          .map((page, index) => ({
            ...page,
            id: `page-${currentDocument.id}-${index}`,
            index: index
          }))
      };

      // Atualizar a lista de documentos
      const updatedDocuments = documents.map(doc => 
        doc.id === currentDocument.id ? updatedDocument : doc
      );

      onDocumentsUpdate(updatedDocuments);

      // Ajustar a página atual se necessário
      const newTotalPages = totalPages - 1;
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }

      NotificationService.success(`Página ${currentPage} deletada com sucesso!`);

    } catch (error) {
      console.error('Erro ao deletar página:', error);
      NotificationService.error(`Erro ao deletar página: ${(error as Error).message}`);
    }
  };

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-800">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 text-sm mb-2">Nenhum documento carregado</p>
          <p className="text-gray-500 text-xs">
            Faça upload de um PDF no sidebar para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      {/* Barra de Ferramentas */}
      <div className="flex justify-between items-center p-2 bg-gray-900 shadow-lg">
        <span className="font-semibold truncate" title={currentDocument.name}>{currentDocument.name}</span>
        <div className="flex items-center space-x-4">
          {/* Controles de Zoom */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} 
              disabled={zoom <= 0.5} 
              className="px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              -
            </button>
            <span className="w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(z => Math.min(3, z + 0.2))} 
              disabled={zoom >= 3} 
              className="px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              +
            </button>
          </div>
          {/* Navegação de Página */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => changePage(-1)} 
              disabled={currentPage <= 1} 
              className="px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              ‹ Anterior
            </button>
            <span>{currentPage} / {totalPages || '--'}</span>
            <button 
              onClick={() => changePage(1)} 
              disabled={currentPage >= totalPages} 
              className="px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Próxima ›
            </button>
          </div>
          {/* Botão de Deletar Página */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleDeletePage} 
              disabled={totalPages <= 1} 
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:bg-gray-600 text-white text-sm font-medium"
              title={totalPages <= 1 ? "Não é possível deletar a última página" : `Deletar página ${currentPage}`}
            >
              🗑️ Deletar
            </button>
          </div>
        </div>
      </div>

      {/* Visualizador de PDF */}
      <div className="flex-grow overflow-auto p-4">
        <div className="flex justify-center">
          {error ? (
            <div className="p-8 text-center text-red-400 bg-red-900/30 rounded-lg">
              <h3 className="font-bold text-xl mb-2">Não foi possível renderizar o PDF</h3>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <Document
              file={currentDocument.file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="p-4">Carregando PDF...</div>}
              error={<div className="p-4 text-red-400">Falha fatal ao carregar o documento.</div>}
            >
              <Page
                pageNumber={currentPage}
                scale={zoom}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                loading={<div className="p-4">Renderizando página...</div>}
                error={<div className="p-4 text-red-400">Erro ao renderizar página {currentPage}</div>}
                className="pdf-page"
                style={{
                  backgroundColor: 'white',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  margin: '0 auto'
                }}
                onLoadSuccess={(page) => {
                  console.log(`Página ${currentPage} carregada com sucesso:`, {
                    width: page.width,
                    height: page.height,
                    pageNumber: currentPage
                  });
                  
                  // Atualizar dimensões da página quando carregada
                  if (currentDocument) {
                    const pageIndex = currentPage - 1;
                    const updatedDocument = {
                      ...currentDocument,
                      pages: currentDocument.pages.map((p, i) => 
                        i === pageIndex ? {
                          ...p,
                          width: page.width,
                          height: page.height
                        } : p
                      )
                    };
                    
                    const updatedDocuments = documents.map(doc => 
                      doc.id === currentDocument.id ? updatedDocument : doc
                    );
                    onDocumentsUpdate(updatedDocuments);
                  }
                }}
                onRenderError={(error) => {
                  console.error(`Erro ao renderizar página ${currentPage}:`, error);
                  NotificationService.error(`Erro ao renderizar página ${currentPage}`);
                }}
              />
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}