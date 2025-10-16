'use client';

import { useState } from 'react';
import { PDFDocument } from '../lib/types';
import MarkdownEditor from './MarkdownEditor';

interface OCRTextEditorProps {
  documents: PDFDocument[];
  selectedPageIndex: number | null;
}

export default function OCRTextEditor({ documents, selectedPageIndex }: OCRTextEditorProps) {
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);

  // Encontrar o documento atual baseado na página selecionada
  const getCurrentDocument = () => {
    if (!documents.length || selectedPageIndex === null) return null;
    
    let pageCount = 0;
    for (const doc of documents) {
      if (selectedPageIndex >= pageCount && selectedPageIndex < pageCount + doc.pages.length) {
        return doc;
      }
      pageCount += doc.pages.length;
    }
    return null;
  };

  const currentDocument = getCurrentDocument();



  return (
    <div className="card fade-in-up border-2 border-green-400 bg-green-50/10">
      <div className="card-header">
        <h3 className="text-base font-semibold text-white flex items-center">
          <span className="text-lg mr-2">📝</span>
          Editor Avançado com Markdown
          <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">NOVO</span>
        </h3>
        <p className="text-sm text-white/70 mt-1">
          Edite PDFs selecionados no sidebar usando Markdown
        </p>
      </div>
      <div className="card-body">
        {currentDocument ? (
          <div className="space-y-4">
            {/* Informações do documento atual */}
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                <span className="text-lg mr-2">📄</span>
                Documento Selecionado:
              </h4>
              <div className="text-sm text-white/80 space-y-1">
                <p><strong>Nome:</strong> {currentDocument.name}</p>
                <p><strong>Páginas:</strong> {currentDocument.pages.length}</p>
                <p><strong>Tamanho:</strong> {(currentDocument.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>

            {/* Botão para Abrir Editor Markdown */}
            <div className="text-center">
              <button
                onClick={() => setShowMarkdownEditor(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-xl shadow-2xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                <span className="text-xl mr-2">📝</span>
                Abrir Editor Markdown
              </button>
            </div>
            
            <div className="text-center text-xs text-white/70">
              💡 <strong>Edição Avançada:</strong> Converta PDF para Markdown, edite com formatação completa e salve como PDF
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 text-sm mb-2">Nenhum documento selecionado</p>
            <p className="text-gray-500 text-xs">
              Selecione um documento no sidebar para começar a editar
            </p>
          </div>
        )}

        {/* Editor Markdown */}
        {showMarkdownEditor && currentDocument && (
          <MarkdownEditor 
            pdfFile={currentDocument.file} 
            onClose={() => setShowMarkdownEditor(false)} 
          />
        )}
      </div>
    </div>
  );
}
