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
    <main className="flex min-h-screen flex-col p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Fênix PDF</h1>
        <p className="text-gray-600">Ferramenta Interna de Edição de PDF</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 flex-grow">
        <aside className="w-full md:w-64 bg-gray-50 p-4 rounded-lg">
          <FileUpload onFilesUploaded={handleFilesUploaded} />
          <div className="mt-6">
            <FileList 
              documents={documents} 
              selectedPageIndex={selectedPageIndex}
              onSelectPage={setSelectedPageIndex}
              onDocumentsUpdate={setDocuments}
            />
          </div>
          <div className="mt-6">
            <button 
              onClick={handleSaveAndDownload}
              className="btn w-full"
              disabled={documents.length === 0}
            >
              Salvar e Baixar
            </button>
          </div>
        </aside>

        <div className="flex-grow flex flex-col">
          <Toolbox currentTool={currentTool} onToolChange={setCurrentTool} />
          <div className="flex-grow bg-gray-50 rounded-lg p-4 mt-4">
            <FileViewer 
              documents={documents} 
              currentTool={currentTool}
              selectedPageIndex={selectedPageIndex}
              onDocumentsUpdate={setDocuments}
            />
          </div>
        </div>
      </div>
    </main>
  );
}