'use client';

import { PDFDocument } from '../lib/types';

interface BreadcrumbProps {
  documents: PDFDocument[];
  currentPageIndex: number | null;
  totalPages: number;
}

export default function Breadcrumb({ documents, currentPageIndex, totalPages }: BreadcrumbProps) {
  const getCurrentDocument = () => {
    if (currentPageIndex === null || documents.length === 0) return null;
    
    let pageCount = 0;
    for (const doc of documents) {
      if (currentPageIndex >= pageCount && currentPageIndex < pageCount + doc.pages.length) {
        return {
          document: doc,
          pageInDocument: currentPageIndex - pageCount + 1,
          documentIndex: documents.indexOf(doc)
        };
      }
      pageCount += doc.pages.length;
    }
    return null;
  };

  const currentDoc = getCurrentDocument();

  if (documents.length === 0) {
    return (
      <nav aria-label="Navegação" className="text-sm text-white/70">
        <ol className="flex items-center space-x-2">
          <li>Fênix PDF</li>
          <li className="text-white/50">•</li>
          <li>Nenhum documento carregado</li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Navegação" className="text-sm text-white/70">
      <ol className="flex items-center space-x-2">
        <li>
          <span className="text-white">Fênix PDF</span>
        </li>
        <li className="text-white/50">•</li>
        <li>
          <span className="text-white">{documents.length} documento{documents.length !== 1 ? 's' : ''}</span>
        </li>
        {currentDoc && (
          <>
            <li className="text-white/50">•</li>
            <li>
              <span className="text-white">{currentDoc.document.name}</span>
            </li>
            <li className="text-white/50">•</li>
            <li>
              <span className="text-white">
                Página {currentDoc.pageInDocument} de {currentDoc.document.pages.length}
              </span>
            </li>
          </>
        )}
        <li className="text-white/50">•</li>
        <li>
          <span className="text-white">
            Total: {totalPages} página{totalPages !== 1 ? 's' : ''}
          </span>
        </li>
      </ol>
    </nav>
  );
}
