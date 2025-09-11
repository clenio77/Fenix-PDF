'use client';

import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import FileViewer from '../components/FileViewer';
import FileList from '../components/FileList';
import Toolbox from '../components/Toolbox';
import { PDFDocument } from '../lib/types';
import { PDFService } from '../lib/pdfService';

export default function Home() {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [currentTool, setCurrentTool] = useState<string>('select');
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);

  const handleFilesUploaded = (newDocs: PDFDocument[]) => {
    setDocuments(prev => [...prev, ...newDocs]);
  };

  const handleSaveAndDownload = async () => {
    if (documents.length === 0) return;
    
    try {
      const blob = await PDFService.generatePDF(documents);
      PDFService.downloadPDF(blob, 'documento-compilado.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Moderno */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container-responsive py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Fênix PDF
                </h1>
                <p className="text-gray-600 font-medium">Ferramenta Interna de Edição de PDF</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {documents.length} documento{documents.length !== 1 ? 's' : ''} carregado{documents.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Layout Principal Responsivo */}
      <main className="container-responsive py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Sidebar - Responsiva */}
          <aside className="xl:col-span-1 space-y-6">
            {/* Upload Card */}
            <div className="card fade-in-up">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload de Arquivos
                </h3>
              </div>
              <div className="card-body">
                <FileUpload onFilesUploaded={handleFilesUploaded} />
              </div>
            </div>

            {/* Documentos Card */}
            <div className="card fade-in-up">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documentos ({documents.length})
                </h3>
              </div>
              <div className="card-body">
                <FileList 
                  documents={documents} 
                  selectedPageIndex={selectedPageIndex}
                  onSelectPage={setSelectedPageIndex}
                  onDocumentsUpdate={setDocuments}
                />
              </div>
            </div>

            {/* Ações Card */}
            <div className="card fade-in-up">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Ações
                </h3>
              </div>
              <div className="card-body space-y-4">
                <button 
                  onClick={handleSaveAndDownload}
                  className="btn w-full flex items-center justify-center"
                  disabled={documents.length === 0}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Salvar e Baixar
                </button>
              </div>
            </div>
          </aside>

          {/* Área Principal - Responsiva */}
          <div className="xl:col-span-3 space-y-6">
            {/* Toolbox Card */}
            <div className="card fade-in-up">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ferramentas de Edição
                </h3>
              </div>
              <div className="card-body">
                <Toolbox currentTool={currentTool} onToolChange={setCurrentTool} />
              </div>
            </div>

            {/* Visualizador Card */}
            <div className="card fade-in-up">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Visualizador de PDF
                </h3>
              </div>
              <div className="card-body">
                <FileViewer 
                  documents={documents} 
                  currentTool={currentTool}
                  selectedPageIndex={selectedPageIndex}
                  onDocumentsUpdate={setDocuments}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}