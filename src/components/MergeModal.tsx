'use client';

import { useState, useEffect } from 'react';
import { NotificationService } from '../lib/notifications';

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mergedFileName?: string) => void;
  documentCount: number;
}

export default function MergeModal({ isOpen, onClose, onConfirm, documentCount }: MergeModalProps) {
  const [mergedFileName, setMergedFileName] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Gerar nome padrão quando abrir o modal
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
      setMergedFileName(`documentos-unidos-${timestamp}.pdf`);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (documentCount < 2) {
      NotificationService.warning('É necessário pelo menos 2 documentos para unir.');
      onClose();
      return;
    }

    const fileName = mergedFileName.trim() || undefined;
    onConfirm(fileName);
    onClose();
  };

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    
    // Garantir que termine com .pdf
    if (value && !value.toLowerCase().endsWith('.pdf')) {
      value += '.pdf';
    }
    
    setMergedFileName(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Unir PDFs</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <p className="text-gray-300 mb-4">
          Unindo {documentCount} documento(s) em um único PDF. Escolha o nome do arquivo final:
        </p>

        <div className="mb-6">
          <label htmlFor="fileName" className="block text-gray-300 text-sm font-medium mb-2">
            Nome do arquivo unificado:
          </label>
          <input
            type="text"
            id="fileName"
            value={mergedFileName}
            onChange={handleFileNameChange}
            placeholder="documentos-unidos.pdf"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-gray-400 text-xs mt-1">
            O arquivo será salvo automaticamente com extensão .pdf
          </p>
        </div>

        {/* Informações sobre a união */}
        <div className="bg-gray-700 p-4 rounded-lg mb-6 flex items-start space-x-3">
          <svg className="w-6 h-6 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p className="text-white font-semibold mb-1">Informações sobre a União:</p>
            <ul className="text-gray-300 text-sm list-disc list-inside space-y-0.5">
              <li>Todos os documentos serão combinados em ordem</li>
              <li>As páginas serão preservadas integralmente</li>
              <li>O arquivo final terá todas as páginas dos documentos originais</li>
              <li>Você pode visualizar o resultado antes de baixar</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200"
          >
            Unir PDFs
          </button>
        </div>
      </div>
    </div>
  );
}
