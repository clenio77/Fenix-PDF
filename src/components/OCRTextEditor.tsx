'use client';

import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { NotificationService } from '../lib/notifications';
import MarkdownEditor from './MarkdownEditor';


export default function OCRTextEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPdfFile(file);
    setShowPreview(false);
  };

  const togglePreview = () => {
    if (pdfFile) {
      setShowPreview(!showPreview);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const calculatePageWidth = () => {
    return Math.round(400 * (zoomLevel / 100));
  };



  return (
    <div className="card fade-in-up">
      <div className="card-header">
        <h3 className="text-base font-semibold text-white flex items-center">
          <span className="text-lg mr-2">📝</span>
          Editor de PDF com Markdown
        </h3>
      </div>
      <div className="card-body space-y-6">
        {/* Upload de PDF */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            📄 PDF para Edição:
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full p-3 border-2 border-blue-300 rounded-lg text-sm font-medium text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>

        {/* Botão de Visualização */}
        {pdfFile && (
          <div className="flex justify-center">
            <button
              onClick={togglePreview}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <span className="text-lg mr-2">
                {showPreview ? '👁️‍🗨️' : '👁️'}
              </span>
              {showPreview ? 'Ocultar Visualização' : 'Visualizar PDF'}
            </button>
          </div>
        )}

        {/* Visualização do PDF */}
        {showPreview && pdfFile && (
          <div className="bg-white/10 rounded-lg border border-white/20 p-4">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
              <span className="text-lg mr-2">📄</span>
              Visualização do PDF:
            </h4>
            
            {/* Controles de navegação */}
            {numPages > 1 && (
              <div className="flex items-center justify-center mb-4 space-x-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <span className="text-white text-sm font-medium">
                  Página {currentPage} de {numPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage >= numPages}
                  className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            )}

            {/* Controles de Zoom */}
            <div className="flex items-center justify-center mb-4 space-x-2">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
                title="Diminuir zoom"
              >
                🔍−
              </button>
              <button
                onClick={handleZoomReset}
                className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded hover:bg-gray-600 transition-colors"
                title="Resetar zoom"
              >
                🔍 {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 300}
                className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
                title="Aumentar zoom"
              >
                🔍+
              </button>
            </div>

            {/* Visualizador PDF */}
            <div className="flex justify-center">
              <div className="border-2 border-white/30 rounded-lg overflow-hidden shadow-lg">
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page
                    pageNumber={currentPage}
                    width={calculatePageWidth()}
                    className="shadow-lg transition-all duration-200"
                  />
                </Document>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-white/80">
                💡 <strong>Dica:</strong> Use os controles de zoom (🔍) para visualizar melhor o conteúdo antes de editar em Markdown
              </p>
            </div>
          </div>
        )}


        {/* Botão para Abrir Editor Markdown */}
        {pdfFile && (
          <div>
            <div className="text-center">
              <button
                onClick={() => setShowMarkdownEditor(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-xl shadow-2xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                <span className="text-xl mr-2">📝</span>
                Abrir Editor Markdown
              </button>
            </div>
            <div className="mt-3 text-center text-xs text-white/70">
              💡 <strong>Edição Avançada:</strong> Converta PDF para Markdown, edite com formatação completa e salve como PDF
            </div>
          </div>
        )}



        {/* Editor Markdown */}
        {showMarkdownEditor && pdfFile && (
          <MarkdownEditor 
            pdfFile={pdfFile} 
            onClose={() => setShowMarkdownEditor(false)} 
          />
        )}
      </div>
    </div>
  );
}
