'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from '../lib/types';
import { PDFService } from '../lib/pdfService';
import { NotificationService } from '../lib/notifications';

interface FileUploadCompactProps {
  onFilesUploaded: (documents: PDFDocument[]) => void;
}

export default function FileUploadCompact({ onFilesUploaded }: FileUploadCompactProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      NotificationService.warning('Por favor, selecione apenas arquivos PDF.');
      return;
    }

    if (pdfFiles.length !== files.length) {
      NotificationService.warning(`${files.length - pdfFiles.length} arquivo(s) não-PDF foram ignorados.`);
    }

    setIsUploading(true);
    const loadingToastId = NotificationService.loading(`Carregando ${pdfFiles.length} PDF(s)...`);

    try {
      const documents: PDFDocument[] = [];
      
      for (const file of pdfFiles) {
        try {
          const document = PDFService.createInitialDocument(file);
          documents.push(document);
        } catch (error) {
          console.error(`Erro ao criar documento ${file.name}:`, error);
          NotificationService.error(`Erro ao criar documento ${file.name}`);
        }
      }

      if (documents.length > 0) {
        onFilesUploaded(documents);
        NotificationService.updateSuccess(
          loadingToastId, 
          `${documents.length} PDF(s) carregado(s) com sucesso!`
        );
      } else {
        NotificationService.updateError(loadingToastId, 'Nenhum PDF foi carregado com sucesso.');
      }
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      NotificationService.updateError(loadingToastId, 'Erro ao processar arquivos PDF.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Área de Upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-blue-400 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="space-y-2">
          <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          {isUploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Carregando PDFs...</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? 'Solte os PDFs aqui' : 'Clique ou arraste PDFs aqui'}
              </p>
              <p className="text-xs text-gray-500">
                Formatos suportados: PDF
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dicas de uso */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium">💡 Dicas:</p>
        <ul className="space-y-1 ml-2">
          <li>• Arraste múltiplos PDFs de uma vez</li>
          <li>• Máximo recomendado: 10 arquivos</li>
          <li>• Tamanho máximo: 50MB por arquivo</li>
        </ul>
      </div>
    </div>
  );
}
