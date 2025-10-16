'use client';

import { useState } from 'react';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { PDFDocument } from '../../lib/types';
import { PDFService } from '../../lib/pdfService';

export default function TestCompressionDebug() {
  const [result, setResult] = useState<string>('');

  const testCompression = async () => {
    console.log('Iniciando teste de compressão...');
    
    try {
      console.log('Criando PDF...');
      const pdfDoc = await PDFLibDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      
      page.drawText('Teste de Compressão PDF', {
        x: 50,
        y: 350,
        size: 20,
      });
      
      console.log('Salvando PDF...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const file = new File([blob], 'teste.pdf', { type: 'application/pdf' });
      
      console.log('Criando documento...');
      const document = PDFService.createInitialDocument(file);
      console.log('Documento criado:', document.name, document.size);
      
      console.log('Iniciando compressão...');
      const compressedDoc = await PDFService.compressPDF(document, 0.7);
      console.log('Compressão concluída:', compressedDoc.name, compressedDoc.size);
      
      const originalSize = document.size;
      const compressedSize = compressedDoc.size;
      const ratio = PDFService.calculateCompressionRatio(originalSize, compressedSize);
      
      const resultText = `
        ✅ Compressão funcionando!
        
        Qualidade escolhida: 70%
        Tamanho original: ${(originalSize / 1024).toFixed(2)} KB
        Tamanho comprimido: ${(compressedSize / 1024).toFixed(2)} KB
        Redução: ${ratio.percentage.toFixed(1)}%
        Taxa de compressão: ${ratio.ratio.toFixed(2)}
        
        Status: ${compressedSize < originalSize ? '✅ Compressão efetiva' : '⚠️ Compressão não efetiva'}
      `;
      
      console.log('Resultado:', resultText);
      setResult(resultText);
      
    } catch (error) {
      console.error('Erro na compressão:', error);
      const errorText = `❌ Erro: ${error}`;
      console.log('Erro:', errorText);
      setResult(errorText);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste Debug de Compressão</h1>
      
      <button 
        onClick={testCompression}
        className="mb-6 p-4 bg-blue-500 text-white rounded hover:bg-blue-600 text-lg font-semibold"
      >
        Testar Compressão (70%) - Debug
      </button>

      <div className="mb-4 p-4 bg-yellow-100 rounded">
        <p className="text-sm">
          <strong>Debug:</strong> Abra o console do navegador (F12) para ver os logs detalhados.
        </p>
      </div>

      {result && (
        <div className="p-4 bg-gray-100 rounded">
          <h4 className="font-semibold mb-2">Resultado:</h4>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}
