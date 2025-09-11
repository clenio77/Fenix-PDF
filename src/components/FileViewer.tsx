'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, TextAnnotation } from '../lib/types';
import { PDFService } from '../lib/pdfService';
import TextEditor from './TextEditor';

// Configurar o worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface FileViewerProps {
  documents: PDFDocument[];
  currentTool: string;
  selectedPageIndex: number | null;
  onDocumentsUpdate: (documents: PDFDocument[]) => void;
}

export default function FileViewer({ documents, currentTool, selectedPageIndex, onDocumentsUpdate }: FileViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<TextAnnotation | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [newAnnotationCoords, setNewAnnotationCoords] = useState<{x: number, y: number, screenX: number, screenY: number} | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calcular o total de páginas de todos os documentos
    const total = documents.reduce((sum, doc) => sum + doc.pages.length, 0);
    setTotalPages(total || 0);
    
    // Resetar a página atual se não houver documentos
    if (total === 0) {
      setCurrentPage(1);
      setCurrentDocument(null);
    }
    
    // Se houver um índice de página selecionado, mostrar essa página
    if (selectedPageIndex !== null && selectedPageIndex < total) {
      setCurrentPage(selectedPageIndex + 1);
    }

    // Encontrar o documento atual baseado na página selecionada
    if (documents.length > 0) {
      let pageCount = 0;
      for (const doc of documents) {
        if (selectedPageIndex !== null && selectedPageIndex >= pageCount && selectedPageIndex < pageCount + doc.pages.length) {
          setCurrentDocument(doc);
          break;
        }
        pageCount += doc.pages.length;
      }
    }
  }, [documents, selectedPageIndex]);

  // Função para renderizar o conteúdo do PDF
  const renderPDFContent = () => {
    if (documents.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Nenhum documento carregado</p>
        </div>
      );
    }

    if (!currentDocument) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Selecione uma página para visualizar</p>
        </div>
      );
    }

    const currentPageIndex = currentPage - 1;
    const currentPageData = currentDocument.pages[currentPageIndex];

    return (
      <div className="flex flex-col items-center">
        <div className="relative bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Renderização do PDF usando react-pdf */}
          <Document
            file={currentDocument.file}
            onLoadSuccess={({ numPages }) => {
              // PDF carregado com sucesso
            }}
            onLoadError={(error) => {
              console.error('Erro ao carregar PDF:', error);
            }}
          >
            <Page
              pageNumber={currentPage}
              width={600}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>

          {/* Anotações de texto sobrepostas */}
          {currentPageData && currentPageData.textAnnotations.map((annotation) => (
            <div
              key={annotation.id}
              className="absolute border border-blue-300 bg-blue-50 bg-opacity-50 rounded p-1 cursor-pointer"
              style={{
                left: `${(annotation.x / currentPageData.width) * 600}px`,
                top: `${(annotation.y / currentPageData.height) * 600}px`,
                width: `${(annotation.width / currentPageData.width) * 600}px`,
                height: `${(annotation.height / currentPageData.height) * 600}px`,
                fontSize: `${annotation.fontSize || 12}px`,
                fontFamily: annotation.fontFamily || 'Arial',
                color: annotation.color || '#000000'
              }}
              onClick={() => handleAnnotationClick(annotation)}
            >
              {annotation.content}
            </div>
          ))}

          {/* Editor de texto para adicionar nova anotação */}
          {isAddingText && newAnnotationCoords && (
            <div
              className="absolute z-10"
              style={{
                left: `${newAnnotationCoords.screenX}px`,
                top: `${newAnnotationCoords.screenY}px`
              }}
            >
              <TextEditor
                annotation={{
                  id: 'new-annotation',
                  content: '',
                  x: newAnnotationCoords.x,
                  y: newAnnotationCoords.y,
                  width: 200,
                  height: 30,
                  fontSize: 12,
                  fontFamily: 'Arial',
                  color: '#000000'
                }}
                onSave={handleAddAnnotation}
                onCancel={() => {
                  setIsAddingText(false);
                  setNewAnnotationCoords(null);
                }}
                onDelete={() => {
                  setIsAddingText(false);
                  setNewAnnotationCoords(null);
                }}
              />
            </div>
          )}

          {/* Editor de texto para editar anotação existente */}
          {editingAnnotation && (
            <div
              className="absolute"
              style={{
                left: `${(editingAnnotation.x / currentPageData.width) * 600}px`,
                top: `${(editingAnnotation.y / currentPageData.height) * 600}px`
              }}
            >
              <TextEditor
                annotation={editingAnnotation}
                onSave={handleUpdateAnnotation}
                onCancel={() => setEditingAnnotation(null)}
                onDelete={handleDeleteAnnotation}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Funções de manipulação de anotações
  const handleAnnotationClick = (annotation: TextAnnotation) => {
    if (currentTool === 'select') {
      setEditingAnnotation(annotation);
    }
  };

  const handleAddAnnotation = (annotation: TextAnnotation) => {
    if (!currentDocument || !newAnnotationCoords) return;

    const currentPageIndex = currentPage - 1;
    const updatedDocument = PDFService.addTextAnnotation(
      currentDocument,
      currentPageIndex,
      annotation.content,
      newAnnotationCoords.x,
      newAnnotationCoords.y,
      {
        width: annotation.width,
        height: annotation.height,
        fontSize: annotation.fontSize,
        fontFamily: annotation.fontFamily,
        color: annotation.color
      }
    );

    const updatedDocuments = documents.map(doc => 
      doc.id === currentDocument.id ? updatedDocument : doc
    );

    onDocumentsUpdate(updatedDocuments);
    setIsAddingText(false);
    setNewAnnotationCoords(null);
  };

  const handleUpdateAnnotation = (updatedAnnotation: TextAnnotation) => {
    if (!currentDocument) return;

    const currentPageIndex = currentPage - 1;
    const updatedDocument = PDFService.updateTextAnnotation(
      currentDocument,
      currentPageIndex,
      updatedAnnotation.id,
      updatedAnnotation
    );

    const updatedDocuments = documents.map(doc => 
      doc.id === currentDocument.id ? updatedDocument : doc
    );

    onDocumentsUpdate(updatedDocuments);
    setEditingAnnotation(null);
  };

  const handleDeleteAnnotation = () => {
    if (!currentDocument || !editingAnnotation) return;

    const currentPageIndex = currentPage - 1;
    const updatedDocument = PDFService.removeTextAnnotation(
      currentDocument,
      currentPageIndex,
      editingAnnotation.id
    );

    const updatedDocuments = documents.map(doc => 
      doc.id === currentDocument.id ? updatedDocument : doc
    );

    onDocumentsUpdate(updatedDocuments);
    setEditingAnnotation(null);
  };

  // Função para lidar com cliques na página para adicionar texto
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTool === 'text' && !isAddingText && !editingAnnotation) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Converter coordenadas do clique para coordenadas do PDF
      const currentPageData = currentDocument?.pages[currentPage - 1];
      if (currentPageData) {
        const pdfX = (x / 600) * currentPageData.width;
        const pdfY = (y / 600) * currentPageData.height;
        
        // Armazenar as coordenadas para usar no TextEditor
        setNewAnnotationCoords({ x: pdfX, y: pdfY, screenX: x, screenY: y });
        setIsAddingText(true);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-auto">
        <div onClick={handlePageClick}>
          {renderPDFContent()}
        </div>
      </div>
      
      {totalPages > 0 && (
        <div className="flex justify-center items-center mt-4 space-x-4">
          <button 
            className="toolbox-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            &lt; Anterior
          </button>
          
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          
          <button 
            className="toolbox-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Próxima &gt;
          </button>
        </div>
      )}
    </div>
  );
}