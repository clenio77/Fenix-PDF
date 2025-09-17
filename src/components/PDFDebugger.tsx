'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from '../lib/types';

// Configurar o worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFDebuggerProps {
  document: PDFDocument;
}

export default function PDFDebugger({ document }: PDFDebuggerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF Debugger - Documento carregado:', { numPages, fileName: document.name });
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF Debugger - Erro ao carregar:', error);
    setError(error.message);
    setLoading(false);
  };

  const onPageLoadSuccess = (page: any) => {
    console.log('PDF Debugger - Página carregada:', { pageNumber, width: page.width, height: page.height });
  };

  const onPageLoadError = (error: Error) => {
    console.error('PDF Debugger - Erro ao carregar página:', error);
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🔧 PDF Debugger</h3>
      
      <div className="mb-4">
        <p><strong>Arquivo:</strong> {document.name}</p>
        <p><strong>Tamanho:</strong> {document.file.size} bytes</p>
        <p><strong>Tipo:</strong> {document.file.type}</p>
        <p><strong>Páginas detectadas:</strong> {numPages}</p>
        <p><strong>Status:</strong> {loading ? 'Carregando...' : error ? 'Erro' : 'Carregado'}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700">
          <strong>Erro:</strong> {error}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          disabled={pageNumber <= 1}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          ← Anterior
        </button>
        <span className="mx-4">
          Página {pageNumber} de {numPages}
        </span>
        <button
          onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
          disabled={pageNumber >= numPages}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Próxima →
        </button>
      </div>

      <div className="border border-gray-200 bg-white p-4">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Carregando PDF...</p>
          </div>
        )}
        
        <Document
          file={document.file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
        >
          <Page
            pageNumber={pageNumber}
            width={400}
            onLoadSuccess={onPageLoadSuccess}
            onLoadError={onPageLoadError}
          />
        </Document>
      </div>
    </div>
  );
}
