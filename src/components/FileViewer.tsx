'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, TextAnnotation } from '../lib/types';
import { PDFService } from '../lib/pdfService';
import { NotificationService } from '../lib/notifications';
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
  const [zoom, setZoom] = useState(1);
  const [editingPdfText, setEditingPdfText] = useState(false);
  const [pdfTextSelection, setPdfTextSelection] = useState<{
    text: string, 
    screenX: number, 
    screenY: number, 
    pdfX: number, 
    pdfY: number, 
    pageIndex: number,
    fontSize: number,
    textWidth: number,
    textHeight: number
  } | null>(null);
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
      <div className="flex flex-col items-center p-4">
        <div className="relative bg-white shadow-lg rounded-lg overflow-visible max-w-full">
          {/* Renderização do PDF usando react-pdf */}
          <Document
            key={`pdf-${currentDocument.id}-${currentDocument.file.lastModified}`}
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
              width={Math.min(600 * zoom, window.innerWidth * 0.6)}
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          </Document>
          
          {/* Overlay invisível para capturar cliques */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={handlePageClick}
            style={{ 
              backgroundColor: 'transparent',
              zIndex: 10
            }}
          />

          {/* Anotações de texto sobrepostas */}
          {currentPageData && currentPageData.textAnnotations.map((annotation) => (
            <div
              key={annotation.id}
              className="absolute border border-blue-300 bg-blue-50 bg-opacity-50 rounded p-1 cursor-pointer"
              style={{
                left: `${(annotation.x / currentPageData.width) * Math.min(600 * zoom, window.innerWidth * 0.6)}px`,
                top: `${(annotation.y / currentPageData.height) * Math.min(600 * zoom, window.innerWidth * 0.6)}px`,
                width: `${(annotation.width / currentPageData.width) * Math.min(600 * zoom, window.innerWidth * 0.6)}px`,
                height: `${(annotation.height / currentPageData.height) * Math.min(600 * zoom, window.innerWidth * 0.6)}px`,
                fontSize: `${(annotation.fontSize || 12) * zoom}px`,
                fontFamily: annotation.fontFamily || 'Arial',
                color: annotation.color || '#000000',
                zIndex: 20
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleAnnotationClick(annotation);
              }}
            >
              {annotation.content}
            </div>
          ))}

          {/* Editor de texto para adicionar nova anotação */}
          {isAddingText && newAnnotationCoords && (
            <div
              className="absolute z-30"
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
                currentTool={currentTool}
              />
            </div>
          )}

          {/* Editor de texto para editar anotação existente */}
          {editingAnnotation && (
            <div
              className="absolute"
              style={{
                left: `${(editingAnnotation.x / currentPageData.width) * Math.min(600 * zoom, window.innerWidth * 0.6)}px`,
                top: `${(editingAnnotation.y / currentPageData.height) * Math.min(600 * zoom, window.innerWidth * 0.6)}px`
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

          {/* Editor de texto do PDF baseado em coordenadas */}
          {editingPdfText && pdfTextSelection && (
            <div
              className="absolute z-40"
              style={{
                left: `${pdfTextSelection.screenX}px`,
                top: `${pdfTextSelection.screenY}px`,
                width: '300px'
              }}
            >
              <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg p-4">
                <div className="text-sm font-semibold text-gray-800 mb-3">
                  ✏️ Editar Texto do PDF
                </div>
                
                {/* Campo de texto */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Texto:</label>
                  <input
                    type="text"
                    placeholder="Digite o novo texto..."
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    autoFocus
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        await handleSaveText();
                      } else if (e.key === 'Escape') {
                        setEditingPdfText(false);
                        setPdfTextSelection(null);
                      }
                    }}
                  />
                </div>
                
                {/* Controles de posição */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">X:</label>
                    <input
                      type="number"
                      value={pdfTextSelection.pdfX}
                      onChange={(e) => setPdfTextSelection({
                        ...pdfTextSelection,
                        pdfX: parseFloat(e.target.value) || 0
                      })}
                      className="w-full p-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Y:</label>
                    <input
                      type="number"
                      value={pdfTextSelection.pdfY}
                      onChange={(e) => setPdfTextSelection({
                        ...pdfTextSelection,
                        pdfY: parseFloat(e.target.value) || 0
                      })}
                      className="w-full p-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>
                
                {/* Controles de tamanho */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tamanho:</label>
                    <input
                      type="number"
                      value={pdfTextSelection.fontSize}
                      onChange={(e) => setPdfTextSelection({
                        ...pdfTextSelection,
                        fontSize: parseFloat(e.target.value) || 12
                      })}
                      className="w-full p-1 border border-gray-300 rounded text-xs"
                      min="8"
                      max="72"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Largura:</label>
                    <input
                      type="number"
                      value={pdfTextSelection.textWidth}
                      onChange={(e) => setPdfTextSelection({
                        ...pdfTextSelection,
                        textWidth: parseFloat(e.target.value) || 100
                      })}
                      className="w-full p-1 border border-gray-300 rounded text-xs"
                      min="20"
                      max="500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Altura:</label>
                    <input
                      type="number"
                      value={pdfTextSelection.textHeight}
                      onChange={(e) => setPdfTextSelection({
                        ...pdfTextSelection,
                        textHeight: parseFloat(e.target.value) || 20
                      })}
                      className="w-full p-1 border border-gray-300 rounded text-xs"
                      min="10"
                      max="100"
                    />
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleSaveText}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    💾 Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditingPdfText(false);
                      setPdfTextSelection(null);
                    }}
                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                  >
                    ❌ Cancelar
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  📍 Posição: ({pdfTextSelection.pdfX.toFixed(1)}, {pdfTextSelection.pdfY.toFixed(1)})
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Função para salvar texto editado usando coordenadas
  const handleSaveText = async () => {
    if (!pdfTextSelection || !currentDocument) return;
    
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    const newText = input?.value?.trim();
    
    if (!newText) {
      NotificationService.warning('Digite um texto para salvar');
      return;
    }
    
    try {
      const loadingToastId = NotificationService.loading('Editando texto do PDF...');
      
      const modifiedDocument = await PDFService.editTextAtCoordinates(
        currentDocument,
        pdfTextSelection.pageIndex,
        pdfTextSelection.pdfX,
        pdfTextSelection.pdfY,
        newText,
        pdfTextSelection.fontSize,
        pdfTextSelection.textWidth,
        pdfTextSelection.textHeight
      );
      
      // Atualizar documentos
      const updatedDocuments = documents.map(doc => 
        doc.id === currentDocument.id ? modifiedDocument : doc
      );
      onDocumentsUpdate(updatedDocuments);
      
      // Atualizar o documento atual para refletir as mudanças
      setCurrentDocument(modifiedDocument);
      
      NotificationService.updateSuccess(loadingToastId, 'Texto editado com sucesso!');
      
      // Fechar editor
      setEditingPdfText(false);
      setPdfTextSelection(null);
    } catch (error) {
      console.error('Erro ao editar texto:', error);
      NotificationService.error('Erro ao editar texto do PDF');
    }
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

    console.log('Salvando anotação:', updatedAnnotation);

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
    
    // Feedback visual de sucesso
    NotificationService.success('Anotação salva com sucesso!');
    console.log('Anotação salva com sucesso!');
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
    console.log('Clique detectado:', { 
      currentTool, 
      isAddingText, 
      editingAnnotation,
      target: e.target,
      currentTarget: e.currentTarget
    });
    
    // Verificar se é um clique válido para adicionar texto
    if (currentTool === 'text' && !isAddingText && !editingAnnotation) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
                // Converter coordenadas do clique para coordenadas do PDF
                const currentPageData = currentDocument?.pages[currentPage - 1];
                if (currentPageData) {
                  const pdfWidth = Math.min(600 * zoom, window.innerWidth * 0.6);
                  const pdfHeight = (pdfWidth * currentPageData.height) / currentPageData.width;
        
        const pdfX = (x / pdfWidth) * currentPageData.width;
        const pdfY = (y / pdfHeight) * currentPageData.height;
        
        // Armazenar as coordenadas para usar no TextEditor
        setNewAnnotationCoords({ x: pdfX, y: pdfY, screenX: x, screenY: y });
        setIsAddingText(true);
        
        console.log('Clique para adicionar texto processado:', { 
          tool: currentTool,
          x, y, pdfX, pdfY, zoom,
          pdfWidth, pdfHeight,
          pageWidth: currentPageData.width,
          pageHeight: currentPageData.height
        });
      } else {
        console.log('Erro: currentPageData não encontrado');
      }
    } else if (currentTool === 'edit' && !isAddingText && !editingAnnotation && !editingPdfText) {
      // Nova implementação baseada em coordenadas (simples e eficaz)
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      
      // Obter dados da página atual para conversão de coordenadas
      const currentPageData = currentDocument?.pages[currentPage - 1];
      if (!currentPageData) {
        NotificationService.error('Dados da página não encontrados');
        return;
      }
      
      // Converter coordenadas da tela para coordenadas do PDF
      const pdfX = (screenX / rect.width) * currentPageData.width;
      const pdfY = currentPageData.height - ((screenY / rect.height) * currentPageData.height);
      
      console.log('Coordenadas capturadas:', {
        screen: { x: screenX, y: screenY },
        pdf: { x: pdfX, y: pdfY },
        page: currentPage - 1
      });
      
      // Abrir editor com coordenadas capturadas
      setPdfTextSelection({
        text: '', // Texto vazio inicial - usuário vai digitar
        screenX: screenX,
        screenY: screenY,
        pdfX: pdfX,
        pdfY: pdfY,
        pageIndex: currentPage - 1,
        fontSize: 12,
        textWidth: 100,
        textHeight: 20
      });
      setEditingPdfText(true);
      
    } else {
      console.log('Clique ignorado:', { 
        reason: currentTool === 'select' ? 'select tool active' :
               currentTool !== 'text' && currentTool !== 'edit' ? 'tool not text or edit' : 
               isAddingText ? 'already adding text' : 
               editingAnnotation ? 'already editing' : 'unknown'
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Controles de zoom e navegação */}
      {totalPages > 0 && (
        <div className="flex justify-between items-center mb-4 p-3 bg-white/5 backdrop-blur-md rounded-xl">
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm font-medium">
              {currentDocument ? `${currentDocument.name} - Página ${currentPage}` : 'Nenhum documento selecionado'}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Controles de zoom */}
            <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
                        <button
                          onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}
                          className="px-2 py-1 text-white hover:bg-white/20 rounded text-sm transition-colors"
                          disabled={zoom <= 0.7}
                        >
                          -
                        </button>
              <span className="px-2 py-1 text-white text-sm min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="px-2 py-1 text-white hover:bg-white/20 rounded text-sm transition-colors"
                disabled={zoom >= 3}
              >
                +
              </button>
              <button
                onClick={() => setZoom(1)}
                className="px-2 py-1 text-white hover:bg-white/20 rounded text-sm transition-colors"
              >
                Reset
              </button>
            </div>
            
            {/* Navegação de páginas */}
            <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="px-2 py-1 text-white hover:bg-white/20 rounded text-sm transition-colors"
                disabled={currentPage <= 1}
              >
                ←
              </button>
              <span className="px-2 py-1 text-white text-sm min-w-[3rem] text-center">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="px-2 py-1 text-white hover:bg-white/20 rounded text-sm transition-colors"
                disabled={currentPage >= totalPages}
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-grow overflow-auto">
        {renderPDFContent()}
      </div>
      
    </div>
  );
}