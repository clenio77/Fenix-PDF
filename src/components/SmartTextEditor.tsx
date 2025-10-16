'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { PDFDocument as PDFDocumentType } from '../lib/types';
import { EnhancedPDFService, EditTextOptions } from '../services/enhancedPDFService';
import { PDFTextAnalyzer } from '../services/PDFTextAnalyzer';
import { NotificationService } from '../lib/notifications';

interface SmartTextEditorProps {
  document: PDFDocumentType;
  pageIndex: number;
  initialText?: string;
  initialX?: number;
  initialY?: number;
  onSave: (result: any) => void;
  onCancel: () => void;
  mode: 'search' | 'coordinates' | 'detect';
}

export default function SmartTextEditor({
  document,
  pageIndex,
  initialText = '',
  initialX = 0,
  initialY = 0,
  onSave,
  onCancel,
  mode
}: SmartTextEditorProps) {
  const [searchText, setSearchText] = useState(initialText);
  const [newText, setNewText] = useState('');
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [coverageWidth, setCoverageWidth] = useState(100);
  const [coverageHeight, setCoverageHeight] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [editOptions, setEditOptions] = useState<EditTextOptions>({
    preserveFormatting: true,
    autoDetectFont: true,
    validateCoverage: true,
    showRecommendations: true
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focar no campo de entrada apropriado
    if (mode === 'search' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  useEffect(() => {
    // Analisar documento quando carregado
    if (document && mode === 'detect') {
      analyzeDocument();
    }
  }, [document, mode]);

  const analyzeDocument = async () => {
    try {
      setIsLoading(true);
      const result = await EnhancedPDFService.analyzeDocument(document);
      setAnalysis(result);
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
      NotificationService.error('Erro ao analisar documento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchText = async () => {
    if (!searchText.trim()) {
      NotificationService.warning('Digite um texto para buscar');
      return;
    }

    try {
      setIsLoading(true);
      
      // Carregar o PDF dinamicamente usando pdf-lib
      const arrayBuffer = await document.file.arrayBuffer();
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      
      const result = await PDFTextAnalyzer.getTextBoundingBox(
        pdfDoc,
        pageIndex,
        searchText
      );

      if (result.found) {
        setRecommendations([`Texto encontrado ${result.totalMatches} vez(es) na página`]);
        if (result.boundingBox) {
          setX(result.boundingBox.x);
          setY(result.boundingBox.y);
          setCoverageWidth(result.boundingBox.width);
          setCoverageHeight(result.boundingBox.height);
        }
        NotificationService.success(`Texto encontrado! ${result.totalMatches} ocorrência(s)`);
      } else {
        setRecommendations([`Texto "${searchText}" não encontrado na página ${pageIndex + 1}`]);
        NotificationService.warning('Texto não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar texto:', error);
      NotificationService.error('Erro ao buscar texto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateOptimalCoverage = () => {
    if (!newText.trim()) {
      NotificationService.warning('Digite o novo texto primeiro');
      return;
    }

    const optimal = PDFTextAnalyzer.calculateOptimalCoverageArea(
      newText,
      fontSize,
      fontFamily
    );

    setCoverageWidth(optimal.width);
    setCoverageHeight(optimal.height);

    // Validar área
    const validation = PDFTextAnalyzer.validateCoverageArea(
      newText,
      fontSize,
      optimal.width,
      optimal.height
    );

    if (validation.valid) {
      NotificationService.success('Área de cobertura calculada automaticamente!');
      setRecommendations([]);
    } else {
      setRecommendations(validation.recommendations);
      NotificationService.warning('Área calculada com recomendações');
    }
  };

  const handleSave = async () => {
    if (!newText.trim()) {
      NotificationService.warning('Digite o novo texto');
      return;
    }

    try {
      setIsLoading(true);
      let result;

      if (mode === 'search') {
        result = await EnhancedPDFService.editTextWithDetection(
          document,
          pageIndex,
          searchText,
          newText,
          editOptions
        );
      } else {
        result = await EnhancedPDFService.editTextAtCoordinatesWithAnalysis(
          document,
          pageIndex,
          x,
          y,
          newText,
          editOptions
        );
      }

      if (result.success) {
        NotificationService.success(result.message);
        if (result.recommendations && result.recommendations.length > 0) {
          setRecommendations(result.recommendations);
        }
        onSave(result);
      } else {
        NotificationService.error(result.message);
        setRecommendations([result.message]);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      NotificationService.error('Erro ao salvar edição');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSearchMode = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center">
          <span className="text-xl mr-2">🔍</span>
          Buscar e Editar Texto
        </h3>
        <p className="text-sm text-blue-700">
          Digite o texto que deseja encontrar e editar no PDF
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Texto a buscar:
        </label>
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Digite o texto que deseja encontrar..."
          className="w-full p-3 border-2 border-blue-300 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          onKeyDown={(e) => e.key === 'Enter' && handleSearchText()}
        />
      </div>

      <button
        onClick={handleSearchText}
        disabled={isLoading || !searchText.trim()}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isLoading ? 'Buscando...' : '🔍 Buscar Texto'}
      </button>
    </div>
  );

  const renderCoordinatesMode = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border border-green-200">
        <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center">
          <span className="text-xl mr-2">📍</span>
          Editar por Coordenadas
        </h3>
        <p className="text-sm text-green-700">
          Edite texto em uma posição específica do PDF
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Coordenada X:</label>
          <input
            type="number"
            value={x}
            onChange={(e) => setX(parseFloat(e.target.value) || 0)}
            className="w-full p-2 border-2 border-green-300 rounded-lg text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Coordenada Y:</label>
          <input
            type="number"
            value={y}
            onChange={(e) => setY(parseFloat(e.target.value) || 0)}
            className="w-full p-2 border-2 border-green-300 rounded-lg text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </div>
      </div>
    </div>
  );

  const renderDetectMode = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200">
        <h3 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
          <span className="text-xl mr-2">🧠</span>
          Análise Inteligente
        </h3>
        <p className="text-sm text-purple-700">
          O sistema analisará automaticamente a estrutura do PDF
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Analisando documento...</p>
        </div>
      )}

      {analysis && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Análise do Documento:</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Texto selecionável:</strong> {analysis.hasSelectableText ? 'Sim' : 'Não'}</p>
            <p><strong>Total de páginas:</strong> {analysis.pageAnalysis.length}</p>
            {analysis.pageAnalysis[pageIndex] && (
              <>
                <p><strong>Texto na página {pageIndex + 1}:</strong> {analysis.pageAnalysis[pageIndex].totalTextItems} itens</p>
                <p><strong>Tamanho médio da fonte:</strong> {analysis.pageAnalysis[pageIndex].averageFontSize.toFixed(1)}px</p>
                <p><strong>Fontes encontradas:</strong> {analysis.pageAnalysis[pageIndex].fontFamilies.join(', ')}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-600 rounded-xl shadow-2xl p-6 w-full max-w-md">
      <div className="text-lg font-bold text-blue-800 mb-4 flex items-center">
        <span className="text-2xl mr-2">✏️</span>
        Editor Inteligente de PDF
      </div>

      {/* Renderizar modo específico */}
      {mode === 'search' && renderSearchMode()}
      {mode === 'coordinates' && renderCoordinatesMode()}
      {mode === 'detect' && renderDetectMode()}

      {/* Campo de novo texto */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <span className="text-lg mr-2">📝</span>
          Novo texto:
        </label>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Digite o novo texto aqui..."
          className="w-full p-3 border-2 border-blue-300 rounded-lg text-base font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </div>

      {/* Controles de formatação */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <span className="text-lg mr-2">🎨</span>
          Formatação:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tamanho da fonte:</label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(parseFloat(e.target.value) || 12)}
              className="w-full p-2 border-2 border-purple-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              min="8"
              max="72"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fonte:</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full p-2 border-2 border-purple-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              <option value="Arial">Arial</option>
              <option value="Times">Times New Roman</option>
              <option value="Courier">Courier</option>
              <option value="Helvetica">Helvetica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Controles de área de cobertura */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <span className="text-lg mr-2">📏</span>
          Área de cobertura:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Largura:</label>
            <input
              type="number"
              value={coverageWidth}
              onChange={(e) => setCoverageWidth(parseFloat(e.target.value) || 100)}
              className="w-full p-2 border-2 border-orange-300 rounded-lg text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              min="20"
              max="500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Altura:</label>
            <input
              type="number"
              value={coverageHeight}
              onChange={(e) => setCoverageHeight(parseFloat(e.target.value) || 20)}
              className="w-full p-2 border-2 border-orange-300 rounded-lg text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              min="10"
              max="100"
            />
          </div>
        </div>
        <button
          onClick={handleCalculateOptimalCoverage}
          className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
        >
          🧮 Calcular Automaticamente
        </button>
      </div>

      {/* Opções avançadas */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <span className="text-lg mr-2">⚙️</span>
          Opções:
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editOptions.preserveFormatting}
              onChange={(e) => setEditOptions({...editOptions, preserveFormatting: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Preservar formatação</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editOptions.autoDetectFont}
              onChange={(e) => setEditOptions({...editOptions, autoDetectFont: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Detectar fonte automaticamente</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editOptions.validateCoverage}
              onChange={(e) => setEditOptions({...editOptions, validateCoverage: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Validar área de cobertura</span>
          </label>
        </div>
      </div>

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-300">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <span className="text-lg mr-2">💡</span>
            Recomendações:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={isLoading || !newText.trim()}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          {isLoading ? '⏳ Salvando...' : '💾 Salvar Edição'}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-bold rounded-lg shadow-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          ❌ Cancelar
        </button>
      </div>
    </div>
  );
}
