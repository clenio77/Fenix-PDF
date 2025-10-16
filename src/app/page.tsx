'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FileUpload from '../components/FileUpload';
import FileViewer from '../components/FileViewer';
import FileList from '../components/FileList';
import OCRTextEditor from '../components/OCRTextEditor';
import Sidebar from '../components/Sidebar';
import Instructions from '../components/Instructions';
import { PDFDocument } from '../lib/types';
import { PDFService } from '../lib/pdfService';
import { NotificationService } from '../lib/notifications';
import { useHistory } from '../lib/useHistory';
import { useFenixShortcuts } from '../lib/useKeyboardShortcuts';
import Breadcrumb from '../components/Breadcrumb';

export default function Home() {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [currentTool, setCurrentTool] = useState<string>('select');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
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

      {/* Layout Principal com Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          documents={documents}
          currentTool={currentTool}
          selectedPageIndex={selectedPageIndex}
          onToolChange={setCurrentTool}
          onDocumentsUpdate={setDocuments}
          onSelectPage={setSelectedPageIndex}
          onFilesUploaded={handleFilesUploaded}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Conteúdo Principal */}
        <main className="flex-1 lg:ml-80">
          <div className="container-responsive py-8">
            {/* Breadcrumb Navigation */}
            <div className="mb-6">
              <Breadcrumb 
                documents={documents} 
                currentPageIndex={selectedPageIndex} 
                totalPages={totalPages} 
              />
            </div>

            {/* Botão para abrir sidebar em mobile */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Abrir Ferramentas</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Instruções Contextuais */}
              <Instructions 
                documentsCount={documents.length}
                selectedPageIndex={selectedPageIndex}
              />

              {/* Editor de PDF com Markdown */}
              <OCRTextEditor 
                documents={documents}
                selectedPageIndex={selectedPageIndex}
              />

              {/* Visualizador Principal */}
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

      {/* Footer Profissional */}
      <Footer />
    </div>
  );
}