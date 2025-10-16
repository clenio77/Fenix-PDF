'use client';

import { useState, useEffect } from 'react';
import { PDFDocument } from '../lib/types';
import { PDFService } from '../lib/pdfService';

interface CompressionStatsProps {
  documents: PDFDocument[];
  compressedDocuments?: PDFDocument[];
}

export default function CompressionStats({ documents, compressedDocuments }: CompressionStatsProps) {
  const [stats, setStats] = useState<{
    originalSize: number;
    compressedSize: number;
    savedBytes: number;
    compressionRatio: number;
    compressionPercentage: number;
  } | null>(null);

  useEffect(() => {
    if (documents.length > 0 && compressedDocuments && compressedDocuments.length > 0) {
      const originalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
      const compressedSize = compressedDocuments.reduce((sum, doc) => sum + doc.size, 0);
      
      const compressionData = PDFService.calculateCompressionRatio(originalSize, compressedSize);
      
      setStats({
        originalSize,
        compressedSize,
        savedBytes: compressionData.savedBytes,
        compressionRatio: compressionData.ratio,
        compressionPercentage: compressionData.percentage
      });
    }
  }, [documents, compressedDocuments]);

  if (!stats) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-sm font-semibold text-green-800">Estatísticas de Compressão</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Tamanho Original:</span>
            <span className="font-medium text-gray-800">{(stats.originalSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tamanho Comprimido:</span>
            <span className="font-medium text-gray-800">{(stats.compressedSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Espaço Economizado:</span>
            <span className="font-medium text-green-600">{(stats.savedBytes / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Taxa de Compressão:</span>
            <span className="font-medium text-blue-600">{stats.compressionPercentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      {/* Barra de progresso visual */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Compressão</span>
          <span>{stats.compressionPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(stats.compressionPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
