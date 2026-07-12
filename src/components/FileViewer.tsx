'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument as PDFDocumentType, TextAnnotation } from '../lib/types';
import { NotificationService } from '../lib/notifications';
import { PDFService } from '../lib/pdfService';
import TextEditor from './TextEditor';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface FileViewerProps {
  documents: PDFDocumentType[];
  currentTool: string;
  selectedPageIndex: number | null;
  onDocumentsUpdate: (documents: PDFDocumentType[]) => void;
}

export default function FileViewer({
  documents,
  currentTool,
  selectedPageIndex,
  onDocumentsUpdate,
}: FileViewerProps) {
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<PDFDocumentType | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<TextAnnotation | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (documents.length === 0) {
      setCurrentDocument(null);
      setTotalPages(0);
      setCurrentPage(1);
      setError(null);
      setEditingAnnotation(null);
      return;
    }

    if (selectedPageIndex !== null) {
      let pageCount = 0;
      for (const doc of documents) {
        if (
          selectedPageIndex >= pageCount &&
          selectedPageIndex < pageCount + doc.pages.length
        ) {
          setCurrentDocument(doc);
          setCurrentPage(selectedPageIndex - pageCount + 1);
          break;
        }
        pageCount += doc.pages.length;
      }
    } else if (documents.length > 0) {
      const unloadedDoc = documents.find((doc) => doc.pages.length === 0);
      const docToSelect = unloadedDoc || documents[0];
      setCurrentDocument(docToSelect);
      setCurrentPage(1);
    }
  }, [documents, selectedPageIndex]);

  const syncDocument = useCallback(
    (updatedDoc: PDFDocumentType) => {
      setCurrentDocument(updatedDoc);
      onDocumentsUpdate(
        documents.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
      );
    },
    [documents, onDocumentsUpdate]
  );

  const onDocumentLoadSuccess = useCallback(
    (pdf: { numPages: number }) => {
      setTotalPages(pdf.numPages);
      setError(null);

      if (!currentDocument) return;

      // Preservar metadados existentes (anotações, rotação, sourceIndex, ordem)
      if (currentDocument.pages.length > 0) {
        return;
      }

      const updatedDocument: PDFDocumentType = {
        ...currentDocument,
        pages: Array.from({ length: pdf.numPages }, (_, i) => ({
          id: `page-${currentDocument.id}-${i}`,
          index: i,
          sourceIndex: i,
          rotation: 0,
          textAnnotations: [],
          width: 0,
          height: 0,
        })),
      };

      syncDocument(updatedDocument);
      NotificationService.success(
        `Documento "${currentDocument.name}" carregado! ${pdf.numPages} página(s) detectada(s).`
      );
    },
    [currentDocument, syncDocument]
  );

  const onDocumentLoadError = useCallback(
    (loadError: Error) => {
      const message = `Falha ao carregar o documento "${currentDocument?.name}".

Possíveis causas:
• Arquivo corrompido ou danificado
• Formato PDF não suportado
• PDF protegido por senha

Detalhes: ${loadError.message}`;

      setError(message);
      NotificationService.error('Erro ao Carregar PDF');
    },
    [currentDocument]
  );

  const pageMeta =
    currentDocument && currentDocument.pages.length > 0
      ? currentDocument.pages[currentPage - 1]
      : null;

  const displayPageCount =
    currentDocument && currentDocument.pages.length > 0
      ? currentDocument.pages.length
      : totalPages || 1;

  const changePage = (offset: number) => {
    setCurrentPage((prev) => Math.max(1, Math.min(prev + offset, displayPageCount)));
    setEditingAnnotation(null);
  };

  const filePageNumber =
    pageMeta && typeof pageMeta.sourceIndex === 'number'
      ? pageMeta.sourceIndex + 1
      : currentPage;

  const handleDeletePage = async () => {
    if (!currentDocument) return;

    const pagesInView =
      currentDocument.pages.length > 0 ? currentDocument.pages.length : totalPages;

    if (pagesInView <= 1) {
      NotificationService.error('Não é possível deletar a última página do documento');
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar a página ${currentPage}?\n\nEsta ação remove a página da exportação.`
    );
    if (!confirmDelete) return;

    try {
      NotificationService.loading('Removendo página...');

      if (currentDocument.pages.length > 0) {
        const updatedDocument = PDFService.removePage(currentDocument, currentPage - 1);
        syncDocument(updatedDocument);
        const newLen = updatedDocument.pages.length;
        if (currentPage > newLen) setCurrentPage(newLen);
        NotificationService.success(`Página ${currentPage} removida da exportação.`);
        return;
      }

      const sourceIdx = filePageNumber - 1;
      const updatedFile = await PDFService.deletePage(currentDocument.file, sourceIdx);
      const updatedDocument = {
        ...PDFService.createInitialDocument(updatedFile),
        id: currentDocument.id,
        name: currentDocument.name,
      };
      syncDocument(updatedDocument);
      NotificationService.success(`Página ${currentPage} deletada com sucesso!`);
    } catch (err) {
      NotificationService.error(`Erro ao deletar página: ${(err as Error).message}`);
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTool !== 'text' || !currentDocument || !pageContainerRef.current) return;
    if ((e.target as HTMLElement).closest('.annotation-box, .text-editor-container')) {
      return;
    }

    const pageEl = pageContainerRef.current.querySelector('.react-pdf__Page');
    if (!pageEl) return;

    const rect = pageEl.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const pageIndex = currentPage - 1;
    let docWithPages = currentDocument;

    if (docWithPages.pages.length === 0 && totalPages > 0) {
      docWithPages = {
        ...currentDocument,
        pages: Array.from({ length: totalPages }, (_, i) => ({
          id: `page-${currentDocument.id}-${i}`,
          index: i,
          sourceIndex: i,
          rotation: 0,
          textAnnotations: [],
          width: rect.width / zoom,
          height: rect.height / zoom,
        })),
      };
    }

    const updated = PDFService.addTextAnnotation(docWithPages, pageIndex, 'Novo texto', x, y, {
      width: 180,
      height: 28,
      fontSize: 14,
    });

    const newAnn =
      updated.pages[pageIndex]?.textAnnotations[
        updated.pages[pageIndex].textAnnotations.length - 1
      ];

    syncDocument(updated);
    if (newAnn) setEditingAnnotation(newAnn);
  };

  const handleSaveAnnotation = (updatedAnnotation: TextAnnotation) => {
    if (!currentDocument) return;
    const updated = PDFService.updateTextAnnotation(
      currentDocument,
      currentPage - 1,
      updatedAnnotation.id,
      updatedAnnotation
    );
    syncDocument(updated);
    setEditingAnnotation(null);
  };

  const handleDeleteAnnotation = () => {
    if (!currentDocument || !editingAnnotation) return;
    const updated = PDFService.removeTextAnnotation(
      currentDocument,
      currentPage - 1,
      editingAnnotation.id
    );
    syncDocument(updated);
    setEditingAnnotation(null);
  };

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-800 min-h-[320px]">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-2">Nenhum documento carregado</p>
          <p className="text-gray-500 text-xs">
            Faça upload de um PDF no sidebar para começar
          </p>
        </div>
      </div>
    );
  }

  const annotations = pageMeta?.textAnnotations || [];
  const pageRotation = pageMeta?.rotation || 0;

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      <div className="flex flex-wrap justify-between items-center gap-2 p-2 bg-gray-900">
        <span className="font-semibold truncate" title={currentDocument.name}>
          {currentDocument.name}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              disabled={zoom <= 0.5}
              className="px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
              aria-label="Diminuir zoom"
            >
              -
            </button>
            <span className="w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              disabled={zoom >= 3}
              className="px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
              aria-label="Aumentar zoom"
            >
              +
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => changePage(-1)}
              disabled={currentPage <= 1}
              className="px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              {currentPage} / {displayPageCount}
            </span>
            <button
              type="button"
              onClick={() => changePage(1)}
              disabled={currentPage >= displayPageCount}
              className="px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
          <button
            type="button"
            onClick={handleDeletePage}
            disabled={displayPageCount <= 1}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:bg-gray-600 text-white text-sm font-medium"
            title={
              displayPageCount <= 1
                ? 'Não é possível deletar a última página'
                : `Deletar página ${currentPage}`
            }
          >
            Deletar página
          </button>
        </div>
      </div>

      {(currentTool === 'text' || currentTool === 'select') && (
        <div className="px-3 py-1.5 bg-gray-900/80 text-xs text-gray-300 border-b border-gray-700">
          {currentTool === 'text'
            ? 'Clique na página para adicionar uma anotação de texto. Ela será incluída no PDF ao baixar.'
            : 'Clique em uma anotação para editar. Use a ferramenta Páginas na área principal para reordenar/rotacionar.'}
        </div>
      )}

      <div className="flex-grow overflow-auto p-4">
        <div className="flex justify-center">
          {error ? (
            <div className="p-8 text-center text-red-400 bg-red-900/30 rounded-lg">
              <h3 className="font-bold text-xl mb-2">Não foi possível renderizar o PDF</h3>
              <p className="text-sm whitespace-pre-line">{error}</p>
            </div>
          ) : (
            <div
              ref={pageContainerRef}
              className={`relative inline-block ${
                currentTool === 'text' ? 'cursor-crosshair' : ''
              }`}
              onClick={handlePageClick}
              style={{
                transform: pageRotation ? `rotate(${pageRotation}deg)` : undefined,
                transition: 'transform 0.2s ease',
              }}
            >
              <Document
                file={currentDocument.file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div className="p-4">Carregando PDF...</div>}
                error={
                  <div className="p-4 text-red-400">Falha fatal ao carregar o documento.</div>
                }
              >
                <Page
                  pageNumber={Math.min(filePageNumber, totalPages || filePageNumber)}
                  scale={zoom}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={<div className="p-4">Renderizando página...</div>}
                  error={
                    <div className="p-4 text-red-400">
                      Erro ao renderizar página {filePageNumber}
                    </div>
                  }
                  className="pdf-page"
                  onLoadSuccess={(page) => {
                    if (!currentDocument || currentDocument.pages.length === 0) return;
                    const pageIndex = currentPage - 1;
                    const existing = currentDocument.pages[pageIndex];
                    if (
                      existing &&
                      existing.width === page.width &&
                      existing.height === page.height
                    ) {
                      return;
                    }
                    const updatedDocument = {
                      ...currentDocument,
                      pages: currentDocument.pages.map((p, i) =>
                        i === pageIndex
                          ? { ...p, width: page.width, height: page.height }
                          : p
                      ),
                    };
                    syncDocument(updatedDocument);
                  }}
                />
              </Document>

              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className="annotation-box absolute border border-blue-400/80 bg-yellow-100/90 text-black overflow-hidden cursor-pointer"
                  style={{
                    left: ann.x * zoom,
                    top: ann.y * zoom,
                    width: (ann.width || 180) * zoom,
                    minHeight: (ann.height || 28) * zoom,
                    fontSize: (ann.fontSize || 12) * zoom,
                    fontFamily: ann.fontFamily || 'Arial',
                    color: ann.color || '#000000',
                    padding: 2 * zoom,
                    zIndex: 10,
                  }}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (currentTool === 'select' || currentTool === 'text') {
                      setEditingAnnotation(ann);
                    }
                  }}
                >
                  {ann.content}
                </div>
              ))}

              {editingAnnotation && (
                <div
                  className="absolute z-50"
                  style={{
                    left: editingAnnotation.x * zoom,
                    top: (editingAnnotation.y + (editingAnnotation.height || 28)) * zoom + 4,
                  }}
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <TextEditor
                    annotation={editingAnnotation}
                    onSave={handleSaveAnnotation}
                    onCancel={() => setEditingAnnotation(null)}
                    onDelete={handleDeleteAnnotation}
                    currentTool={currentTool}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
