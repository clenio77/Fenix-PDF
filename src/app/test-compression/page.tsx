'use client';

import { useState } from 'react';
import { PDFDocument } from '../../lib/types';
import { PDFService } from '../../lib/pdfService';

export default function TestCompression() {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [compressionResult, setCompressionResult] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const document = PDFService.createInitialDocument(file);
      setDocuments([document]);
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
    }
  };

  const testCompression = async (quality: number) => {
    if (documents.length === 0) return;

    try {
      const originalSize = documents[0].size;
      const compressedDoc = await PDFService.compressPDF(documents[0], quality);
      const compressedSize = compressedDoc.size;
      
      const ratio = PDFService.calculateCompressionRatio(originalSize, compressedSize);
      
      setCompressionResult(`
        Qualidade escolhida: ${(quality * 100).toFixed(0)}%
        Tamanho original: ${(originalSize / 1024).toFixed(2)} KB
        Tamanho comprimido: ${(compressedSize / 1024).toFixed(2)} KB
        Redução: ${ratio.percentage.toFixed(1)}%
        Taxa de compressão: ${ratio.ratio.toFixed(2)}
      `);
    } catch (error) {
      console.error('Erro na compressão:', error);
      setCompressionResult(`Erro: ${error}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Compressão PDF</h1>
      
      <div className="mb-6">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="mb-4"
        />
        
        {documents.length > 0 && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <p>Arquivo carregado: {documents[0].name}</p>
            <p>Tamanho: {(documents[0].size / 1024).toFixed(2)} KB</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Testar Compressão:</h3>
        
        <button 
          onClick={() => testCompression(0.9)}
          className="block w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Baixa Compressão (90%)
        </button>
        
        <button 
          onClick={() => testCompression(0.7)}
          className="block w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Compressão Média (70%)
        </button>
        
        <button 
          onClick={() => testCompression(0.5)}
          className="block w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Alta Compressão (50%)
        </button>
        
        <button 
          onClick={() => testCompression(0.3)}
          className="block w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Compressão Máxima (30%)
        </button>
      </div>

      {compressionResult && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h4 className="font-semibold mb-2">Resultado:</h4>
          <pre className="whitespace-pre-wrap text-sm">{compressionResult}</pre>
        </div>
      )}
    </div>
  );
}
