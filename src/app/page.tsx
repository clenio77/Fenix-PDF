'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FileUpload from '../components/FileUpload';
import FileViewer from '../components/FileViewer';
import FileList from '../components/FileList';
import OCRTextEditor from '../components/OCRTextEditor';
import { PDFDocument } from '../lib/types';
import { PDFService } from '../lib/pdfService';
import { NotificationService } from '../lib/notifications';
import { useHistory } from '../lib/useHistory';
import { useFenixShortcuts } from '../lib/useKeyboardShortcuts';
import Breadcrumb from '../components/Breadcrumb';

export default function Home() {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  
  // Hook de histórico para undo/redo
  const { addAction, undo, redo, canUndo, canRedo } = useHistory();
  
  // Calcular total de páginas
  const totalPages = documents.reduce((sum, doc) => sum + doc.pages.length, 0);
  
  const handleSaveAndDownload = async () => {
    if (documents.length === 0) {
      NotificationService.warning('Nenhum documento carregado para unir.');
      return;
    }
    
    let loadingToastId: string | undefined;
    
    try {
      // Mostrar loading com notificação
      loadingToastId = NotificationService.loading('Unindo PDFs...');
      
      const blob = await PDFService.generatePDF(documents);
      
      // Gerar nome do arquivo baseado na data
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `documentos-unidos-${timestamp}.pdf`;
      
      PDFService.downloadPDF(blob, filename);
      
      // Mostrar sucesso
      NotificationService.updateSuccess(loadingToastId, `PDF gerado com sucesso! ${documents.length} documento(s) unido(s) em "${filename}"`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      if (loadingToastId) {
        NotificationService.updateError(loadingToastId, 'Erro ao gerar PDF. Verifique se os arquivos estão válidos e tente novamente.');
      } else {
        NotificationService.error('Erro ao gerar PDF. Verifique se os arquivos estão válidos e tente novamente.');
      }
    }
  };

  const handleFilesUploaded = (newDocs: PDFDocument[]) => {
    setDocuments(prev => [...prev, ...newDocs]);
  };

  // Keyboard shortcuts
  useFenixShortcuts({
    onUndo: canUndo ? undo : undefined,
    onRedo: canRedo ? redo : undefined,
    onSave: documents.length > 0 ? handleSaveAndDownload : undefined,
  });

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header Profissional */}
      <Header documentsCount={documents.length} />

      {/* Layout Principal Responsivo */}
      <main className="container-responsive py-8 flex-grow">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb 
            documents={documents} 
            currentPageIndex={selectedPageIndex} 
            totalPages={totalPages} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar - Responsiva */}
          <aside className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Upload Card */}
            <div className="card fade-in-up">
              <div className="card-header">
                <h3 className="text-base font-semibold text-white flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <h3 className="text-base font-semibold text-white flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <h3 className="text-base font-semibold text-white flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Unir PDFs
                </h3>
              </div>
              <div className="card-body space-y-4">
                {/* Informações sobre o merge */}
                {documents.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-blue-800">Documentos para Unir</span>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      {documents.map((doc, index) => (
                        <div key={doc.id} className="flex justify-between">
                          <span className="truncate">{doc.name}</span>
                          <span>({doc.pages.length} páginas)</span>
                        </div>
                      ))}
                      <div className="border-t border-blue-200 pt-1 mt-2 font-medium">
                        Total: {documents.reduce((sum, doc) => sum + doc.pages.length, 0)} páginas
                      </div>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={handleSaveAndDownload}
                  className="btn w-full flex items-center justify-center"
                  disabled={documents.length === 0}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {documents.length === 0 ? 'Nenhum documento' : `Unir ${documents.length} PDF(s)`}
                </button>
                
                {documents.length === 0 && (
                  <div className="text-xs text-gray-500 text-center space-y-2">
                    <p>Carregue PDFs para poder uni-los</p>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2 text-left">
                      <p className="font-medium mb-1">Como usar:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Faça upload de múltiplos PDFs</li>
                        <li>• Reordene as páginas se necessário</li>
                        <li>• Adicione anotações de texto</li>
                        <li>• Clique em "Unir PDFs" para baixar</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Área Principal - Responsiva */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Editor de PDF com Markdown - Modal Fullscreen */}
            <div className="card fade-in-up border-2 border-green-400 bg-green-50/10">
              <div className="card-header">
                <h3 className="text-base font-semibold text-white flex items-center">
                  <span className="text-lg mr-2">📝</span>
                  Editor Avançado com Markdown
                  <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">NOVO</span>
                </h3>
                <p className="text-sm text-white/70 mt-1">
                  Clique em "Abrir Editor Markdown" para editar em tela cheia
                </p>
              </div>
              <div className="card-body">
                <OCRTextEditor />
              </div>
            </div>

            {/* Visualizador Card */}
            <div className="card fade-in-up">
              <div className="card-header">
                <h3 className="text-base font-semibold text-white flex items-center">
                  <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Visualizador de PDF
                </h3>
              </div>
              <div className="card-body">
                <FileViewer 
                  documents={documents} 
                  currentTool="select"
                  selectedPageIndex={selectedPageIndex}
                  onDocumentsUpdate={setDocuments}
                />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer Profissional */}
      <Footer />
    </div>
  );
}