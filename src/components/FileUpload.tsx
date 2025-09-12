'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from '../lib/types';
import { PDFService } from '../lib/pdfService';
import { ValidationService } from '../lib/validation';
import { NotificationService } from '../lib/notifications';

interface FileUploadProps {
  onFilesUploaded: (documents: PDFDocument[]) => void;
}

export default function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const processFiles = async (files: FileList) => {
    // Validar arquivos antes de processar
    const { validFiles, errors } = ValidationService.validatePDFs(files);
    
    // Mostrar erros de validação
    if (errors.length > 0) {
      errors.forEach(error => NotificationService.error(error));
    }
    
    if (validFiles.length === 0) {
      if (errors.length === 0) {
        NotificationService.warning('Nenhum arquivo PDF válido encontrado');
      }
      return;
    }

    try {
      const newDocuments: PDFDocument[] = [];
      
      for (const file of validFiles) {
        try {
          const document = await PDFService.loadPDF(file);
          newDocuments.push(document);
        } catch (error) {
          console.error(`Erro ao carregar ${file.name}:`, error);
          NotificationService.error(`Erro ao carregar ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      if (newDocuments.length > 0) {
        onFilesUploaded(newDocuments);
        NotificationService.success(`${newDocuments.length} documento(s) carregado(s) com sucesso`);
      }
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      NotificationService.error('Erro ao processar arquivos');
    }
    
    // Limpar o input para permitir selecionar os mesmos arquivos novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-blue-600"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h4 className="text-base font-semibold text-gray-800 mb-2">
            Upload de PDFs
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Clique para selecionar ou arraste arquivos PDF aqui
          </p>
          <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Formatos suportados: PDF
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}