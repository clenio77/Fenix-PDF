'use client';

import { useState } from 'react';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { PDFDocument } from '../../lib/types';
import { PDFService } from '../../lib/pdfService';

export default function TestCompressionSimple() {
  const [result, setResult] = useState<string>('');

  const testCompression = async () => {
    try {
      const pdfDoc = await PDFLibDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      
      page.drawText('Teste de Compressão PDF', {
        x: 50,
        y: 350,
        size: 20,
      });
      
      page.drawText('Este é um documento de teste para verificar a compressão.', {
        x: 50,
        y: 300,
        size: 12,
      });
      
      page.drawText('Qualidade: 70%', {
        x: 50,
        y: 250,
        size: 12,
      });
      
      const pdfBytes = await pdfDoc.save();
      const uint8Array = new Uint8Array(pdfBytes);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const file = new File([blob], 'teste.pdf', { type: 'application/pdf' });
      
      const document = PDFService.createInitialDocument(file);
      
      // Testar compressão com qualidade 0.7 (70%)
      const compressedDoc = await PDFService.compressPDF(document, 0.7);
      
      const originalSize = document.size;
      const compressedSize = compressedDoc.size;
      const ratio = PDFService.calculateCompressionRatio(originalSize, compressedSize);
      
      setResult(`
        ✅ Compressão funcionando!
        
        Qualidade escolhida: 70%
        Tamanho original: ${(originalSize / 1024).toFixed(2)} KB
        Tamanho comprimido: ${(compressedSize / 1024).toFixed(2)} KB
        Redução: ${ratio.percentage.toFixed(1)}%
        Taxa de compressão: ${ratio.ratio.toFixed(2)}
        
        Status: ${compressedSize < originalSize ? '✅ Compressão efetiva' : '⚠️ Compressão não efetiva'}
      `);
      
    } catch (error) {
      console.error('Erro na compressão:', error);
      setResult(`❌ Erro: ${error}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste Simples de Compressão</h1>
      
      <button 
        onClick={testCompression}
        className="mb-6 p-4 bg-blue-500 text-white rounded hover:bg-blue-600 text-lg font-semibold"
      >
        Testar Compressão (70%)
      </button>

      {result && (
        <div className="p-4 bg-gray-100 rounded">
          <h4 className="font-semibold mb-2">Resultado:</h4>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}
