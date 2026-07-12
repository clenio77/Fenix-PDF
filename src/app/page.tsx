'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
import ScannerExtractor from '../components/ScannerExtractor';

export default function Home() {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [currentTool, setCurrentTool] = useState<string>('select');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { undo, redo, canUndo, canRedo } = useHistory();

  const totalPages = documents.reduce((sum, doc) => sum + doc.pages.length, 0);

  const handleSaveAndDownload = async () => {
    if (documents.length === 0) {
      NotificationService.warning('Nenhum documento carregado para baixar.');
      return;
    }

    let loadingToastId: string | undefined;

    try {
      setIsDownloading(true);
      loadingToastId = NotificationService.loading('Gerando PDF...');

      const blob = await PDFService.generatePDF(documents);

      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
      const filename =
        documents.length === 1
          ? documents[0].name.replace(/\.pdf$/i, '') + `-editado-${timestamp}.pdf`
          : `documentos-unidos-${timestamp}.pdf`;

      PDFService.downloadPDF(blob, filename);

      NotificationService.updateSuccess(
        loadingToastId,
        `PDF baixado: "${filename}" (${documents.length} documento(s), ordem/rotação/anotações aplicadas).`
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      if (loadingToastId) {
        NotificationService.updateError(
          loadingToastId,
          'Erro ao gerar PDF. Verifique se os arquivos estão válidos e tente novamente.'
        );
      } else {
        NotificationService.error(
          'Erro ao gerar PDF. Verifique se os arquivos estão válidos e tente novamente.'
        );
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFilesUploaded = (newDocs: PDFDocument[]) => {
    setDocuments((prev) => [...prev, ...newDocs]);
  };

  useFenixShortcuts({
    onUndo: canUndo ? undo : undefined,
    onRedo: canRedo ? redo : undefined,
    onSave: documents.length > 0 ? handleSaveAndDownload : undefined,
  });

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header
        documentsCount={documents.length}
        onDownload={handleSaveAndDownload}
        canDownload={documents.length > 0 && !isDownloading}
        isDownloading={isDownloading}
      />

      <div className="flex flex-1">
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

        <main className="flex-1 lg:ml-80">
          <div className="container-responsive py-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <Breadcrumb
                documents={documents}
                currentPageIndex={selectedPageIndex}
                totalPages={totalPages}
              />
              {documents.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAndDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {isDownloading ? 'Gerando…' : 'Baixar PDF'}
                  <span className="hidden sm:inline text-xs opacity-80">(Ctrl+S)</span>
                </button>
              )}
            </div>

            <div className="lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span>Abrir Ferramentas</span>
              </button>
            </div>

            <div className="space-y-6">
              {currentTool === 'scanner' ? (
                <div className="card fade-in-up border-2 border-indigo-400 bg-indigo-50/5">
                  <div className="card-header bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/30">
                    <h3 className="text-base font-bold text-white flex items-center">
                      Scanner e Extração de Metadados Jurídicos
                      <span className="ml-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">
                        IA
                      </span>
                    </h3>
                    <p className="text-xs text-white/60 mt-1">
                      OCR no navegador; a extração jurídica envia texto à API Gemini quando
                      configurada.
                    </p>
                  </div>
                  <div className="card-body">
                    <ScannerExtractor
                      documents={documents}
                      selectedPageIndex={selectedPageIndex}
                      onDocumentsUpdate={setDocuments}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Instructions
                    documentsCount={documents.length}
                    selectedPageIndex={selectedPageIndex}
                  />

                  {documents.some((d) => d.pages.length > 0) && (
                    <div className="card fade-in-up">
                      <div className="card-header">
                        <h3 className="text-base font-semibold text-white">
                          Páginas — reordenar, rotacionar e excluir
                        </h3>
                        <p className="text-xs text-white/60 mt-1">
                          Arraste para reordenar (dentro do mesmo PDF). Alterações entram no download.
                        </p>
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
                  )}

                  <OCRTextEditor
                    documents={documents}
                    selectedPageIndex={selectedPageIndex}
                  />

                  <div className="card fade-in-up">
                    <div className="card-header">
                      <h3 className="text-base font-semibold text-white flex items-center">
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
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
