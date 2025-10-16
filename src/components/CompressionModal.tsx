'use client';

import { useState } from 'react';
import { NotificationService } from '../lib/notifications';

interface CompressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quality: number, compressionLevel: string) => void;
  documentCount: number;
}

export default function CompressionModal({ isOpen, onClose, onConfirm, documentCount }: CompressionModalProps) {
  const [quality, setQuality] = useState(0.7);
  const [compressionLevel, setCompressionLevel] = useState('medium');

  const compressionLevels = [
    {
      id: 'low',
      name: 'Baixa Compressão',
      description: 'Mantém alta qualidade, redução mínima',
      quality: 0.9,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'medium',
      name: 'Compressão Média',
      description: 'Equilibrio entre qualidade e tamanho',
      quality: 0.7,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'high',
      name: 'Alta Compressão',
      description: 'Máxima redução, qualidade reduzida',
      quality: 0.5,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'maximum',
      name: 'Compressão Máxima',
      description: 'Redução extrema, qualidade mínima',
      quality: 0.3,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  const handleLevelSelect = (level: typeof compressionLevels[0]) => {
    setCompressionLevel(level.id);
    setQuality(level.quality);
  };

  const handleConfirm = () => {
    onConfirm(quality, compressionLevel);
    onClose();
  };

  const handleCustomQualityChange = (value: number) => {
    setQuality(value);
    // Determinar nível baseado na qualidade personalizada
    if (value >= 0.8) setCompressionLevel('low');
    else if (value >= 0.6) setCompressionLevel('medium');
    else if (value >= 0.4) setCompressionLevel('high');
    else setCompressionLevel('maximum');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Configurar Compressão de PDF
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Comprimindo <span className="font-semibold">{documentCount}</span> documento(s). 
              Escolha o nível de compressão desejado:
            </p>
          </div>

          {/* Níveis de Compressão */}
          <div className="space-y-3 mb-6">
            {compressionLevels.map((level) => (
              <div
                key={level.id}
                onClick={() => handleLevelSelect(level)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  compressionLevel === level.id
                    ? `${level.bgColor} ${level.borderColor} border-2`
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${level.color}`}>
                      {level.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {level.description}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${level.bgColor} ${level.color}`}>
                    {(level.quality * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controle Personalizado */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qualidade Personalizada: {(quality * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => handleCustomQualityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Máxima Compressão</span>
              <span>Máxima Qualidade</span>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Dicas de Compressão:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Baixa:</strong> Ideal para documentos importantes</li>
                  <li>• <strong>Média:</strong> Recomendado para uso geral</li>
                  <li>• <strong>Alta:</strong> Para economizar espaço</li>
                  <li>• <strong>Máxima:</strong> Apenas para arquivamento</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Comprimir PDFs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
