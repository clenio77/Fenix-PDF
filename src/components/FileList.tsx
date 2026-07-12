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

export default function FileList({
  documents,
  selectedPageIndex,
  onSelectPage,
  onDocumentsUpdate,
}: FileListProps) {
  const [draggedPage, setDraggedPage] = useState<{
    docIndex: number;
    pageIndex: number;
  } | null>(null);
  const [hoveredPage, setHoveredPage] = useState<{
    docIndex: number;
    pageIndex: number;
  } | null>(null);

  const handleDragStart = (docIndex: number, pageIndex: number) => {
    setDraggedPage({ docIndex, pageIndex });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (targetDocIndex: number, targetPageIndex: number) => {
    if (!draggedPage) return;

    const { docIndex: sourceDocIndex, pageIndex: sourcePageIndex } = draggedPage;

    // Export usa o File de cada documento; mover entre PDFs diferentes
    // quebraria o sourceIndex. Só reordenar dentro do mesmo arquivo.
    if (sourceDocIndex !== targetDocIndex) {
      setDraggedPage(null);
      return;
    }

    const updatedDocuments = [...documents];
    updatedDocuments[sourceDocIndex] = PDFService.reorderPages(
      updatedDocuments[sourceDocIndex],
      sourcePageIndex,
      targetPageIndex
    );
    onDocumentsUpdate(updatedDocuments);
    setDraggedPage(null);
  };

  const handleRotate = (docIndex: number, pageIndex: number) => {
    const updatedDocuments = [...documents];
    updatedDocuments[docIndex] = PDFService.rotatePage(
      updatedDocuments[docIndex],
      pageIndex,
      90
    );
    onDocumentsUpdate(updatedDocuments);
  };

  const handleDelete = (docIndex: number, pageIndex: number) => {
    if (!confirm('Tem certeza que deseja excluir esta página da exportação?')) {
      return;
    }
    try {
      const updatedDocuments = [...documents];
      updatedDocuments[docIndex] = PDFService.removePage(
        updatedDocuments[docIndex],
        pageIndex
      );
      onDocumentsUpdate(updatedDocuments);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center p-4 border border-white/10 rounded-lg">
        <p className="text-white/60 text-sm">Nenhum documento carregado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc, docIndex) => (
        <div key={doc.id} className="border border-white/10 rounded-lg p-2 bg-black/20">
          <h4 className="font-medium truncate mb-2 text-white text-sm">{doc.name}</h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {doc.pages.map((page, pageIndex) => {
              let globalPageIndex = 0;
              for (let i = 0; i < docIndex; i++) {
                globalPageIndex += documents[i].pages.length;
              }
              globalPageIndex += pageIndex;

              const isHovered =
                hoveredPage?.docIndex === docIndex && hoveredPage?.pageIndex === pageIndex;
              const isSelected = selectedPageIndex === globalPageIndex;

              return (
                <div
                  key={page.id || `${doc.id}-page-${pageIndex}`}
                  className={`relative border rounded-md p-1 cursor-pointer group transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-400/40'
                      : 'border-white/20 hover:border-blue-400'
                  }`}
                  onClick={() => onSelectPage(globalPageIndex)}
                  draggable
                  onDragStart={() => handleDragStart(docIndex, pageIndex)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(docIndex, pageIndex)}
                  onMouseEnter={() => setHoveredPage({ docIndex, pageIndex })}
                  onMouseLeave={() => setHoveredPage(null)}
                >
                  <div className="aspect-[3/4] bg-gray-700 flex items-center justify-center relative overflow-hidden">
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      <span className="text-xs text-gray-300">Pág. {pageIndex + 1}</span>
                    </div>

                    {page.rotation !== 0 && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                        {page.rotation}°
                      </div>
                    )}
                  </div>

                  {(isHovered || isSelected) && (
                    <div className="absolute top-1 right-1 flex space-x-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotate(docIndex, pageIndex);
                        }}
                        className="bg-white p-1 rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                        title="Rotacionar 90°"
                        aria-label="Rotacionar 90 graus"
                      >
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(docIndex, pageIndex);
                        }}
                        className="bg-white p-1 rounded-full shadow-sm hover:bg-red-100 transition-colors"
                        title="Excluir página"
                        aria-label="Excluir página"
                      >
                        <svg
                          className="w-4 h-4 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {page.textAnnotations.length > 0 && (
                    <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1 rounded">
                      {page.textAnnotations.length}
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
