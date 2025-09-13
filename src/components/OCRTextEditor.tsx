'use client';

import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { NotificationService } from '../lib/notifications';

interface Edicao {
  antigo: string;
  novo: string;
}

export default function OCRTextEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [edicoes, setEdicoes] = useState<Edicao[]>([{ antigo: '', novo: '' }]);
  const [linguagemOCR, setLinguagemOCR] = useState('por+eng');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  const adicionarEdicao = () => {
    setEdicoes([...edicoes, { antigo: '', novo: '' }]);
  };

  const atualizarEdicao = (index: number, field: keyof Edicao, value: string) => {
    const novoEdicoes = [...edicoes];
    novoEdicoes[index][field] = value;
    setEdicoes(novoEdicoes);
  };

  const removerEdicao = (index: number) => {
    setEdicoes(edicoes.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPdfFile(file);
    setShowPreview(false);
    setResult(null);
  };

  const togglePreview = () => {
    if (pdfFile) {
      setShowPreview(!showPreview);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const calculatePageWidth = () => {
    return Math.round(400 * (zoomLevel / 100));
  };

  const downloadPDF = (base64Pdf: string, fileName: string) => {
    try {
      // Converte base64 para blob
      const byteCharacters = atob(base64Pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Cria link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      NotificationService.success(`PDF editado baixado: ${fileName}`);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      NotificationService.error('Erro ao fazer download do PDF');
    }
  };

  const handleProcessar = async () => {
    if (!pdfFile || edicoes.some(e => !e.antigo)) {
      NotificationService.warning('Preencha PDF e edições!');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', pdfFile);
      formData.append('edicoes', JSON.stringify(edicoes.filter(e => e.antigo)));
      formData.append('linguagemOCR', linguagemOCR);

      const response = await fetch('/api/editar-pdf-ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        NotificationService.success('PDF processado com sucesso!');
        
        // Faz download do PDF editado
        if (data.pdfBase64) {
          downloadPDF(data.pdfBase64, data.fileName);
        }
      } else {
        NotificationService.error(data.error || 'Erro no processamento');
      }
    } catch (error) {
      NotificationService.error('Erro: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card fade-in-up">
      <div className="card-header">
        <h3 className="text-base font-semibold text-white flex items-center">
          <span className="text-lg mr-2">🔍</span>
          Editor OCR para PDFs Escaneados
        </h3>
      </div>
      <div className="card-body space-y-6">
        {/* Upload de PDF */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            📄 PDF (Escaneado ou Nativo):
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full p-3 border-2 border-blue-300 rounded-lg text-sm font-medium text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>

        {/* Botão de Visualização */}
        {pdfFile && (
          <div className="flex justify-center">
            <button
              onClick={togglePreview}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <span className="text-lg mr-2">
                {showPreview ? '👁️‍🗨️' : '👁️'}
              </span>
              {showPreview ? 'Ocultar Visualização' : 'Visualizar PDF'}
            </button>
          </div>
        )}

        {/* Visualização do PDF */}
        {showPreview && pdfFile && (
          <div className="bg-white/10 rounded-lg border border-white/20 p-4">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
              <span className="text-lg mr-2">📄</span>
              Visualização do PDF:
            </h4>
            
            {/* Controles de navegação */}
            {numPages > 1 && (
              <div className="flex items-center justify-center mb-4 space-x-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <span className="text-white text-sm font-medium">
                  Página {currentPage} de {numPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage >= numPages}
                  className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            )}

            {/* Controles de Zoom */}
            <div className="flex items-center justify-center mb-4 space-x-2">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
                title="Diminuir zoom"
              >
                🔍−
              </button>
              <button
                onClick={handleZoomReset}
                className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded hover:bg-gray-600 transition-colors"
                title="Resetar zoom"
              >
                🔍 {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 300}
                className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
                title="Aumentar zoom"
              >
                🔍+
              </button>
            </div>

            {/* Visualizador PDF */}
            <div className="flex justify-center">
              <div className="border-2 border-white/30 rounded-lg overflow-hidden shadow-lg">
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page
                    pageNumber={currentPage}
                    width={calculatePageWidth()}
                    className="shadow-lg transition-all duration-200"
                  />
                </Document>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-white/80">
                💡 <strong>Dica:</strong> Use os controles de zoom (🔍) para visualizar melhor o texto que deseja editar
              </p>
            </div>
          </div>
        )}

        {/* Seleção de Idioma OCR */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            🌍 Idioma OCR (para PDFs escaneados):
          </label>
          <select
            value={linguagemOCR}
            onChange={(e) => setLinguagemOCR(e.target.value)}
            className="w-full p-3 border-2 border-green-300 rounded-lg text-sm font-medium text-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
          >
            <option value="por">🇧🇷 Português</option>
            <option value="eng">🇺🇸 Inglês</option>
            <option value="por+eng">🇧🇷🇺🇸 Português + Inglês</option>
            <option value="spa">🇪🇸 Espanhol</option>
            <option value="fra">🇫🇷 Francês</option>
          </select>
        </div>

        {/* Edições */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
            <span className="text-lg mr-2">✏️</span>
            Edições de Texto:
          </h4>
          {edicoes.map((edicao, index) => (
            <div key={index} className="mb-4 p-4 bg-white/10 rounded-lg border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-white mb-1">
                    Texto Antigo:
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o texto a ser substituído..."
                    value={edicao.antigo}
                    onChange={(e) => atualizarEdicao(index, 'antigo', e.target.value)}
                    className="w-full p-2 border-2 border-red-300 rounded-lg text-sm font-medium text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white mb-1">
                    Novo Texto:
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o novo texto..."
                    value={edicao.novo}
                    onChange={(e) => atualizarEdicao(index, 'novo', e.target.value)}
                    className="w-full p-2 border-2 border-green-300 rounded-lg text-sm font-medium text-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  />
                </div>
              </div>
              <button
                onClick={() => removerEdicao(index)}
                className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200"
              >
                ❌ Remover Edição
              </button>
            </div>
          ))}
          <button
            onClick={adicionarEdicao}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
          >
            <span className="text-lg mr-2">➕</span>
            Adicionar Nova Edição
          </button>
        </div>

        {/* Botão de Processamento */}
        <button
          onClick={handleProcessar}
          disabled={!pdfFile || loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-lg font-bold rounded-xl shadow-2xl hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <span className="text-xl mr-2">⏳</span>
              Processando com OCR...
            </>
          ) : (
            <>
              <span className="text-xl mr-2">🚀</span>
              Extrair, Editar e Salvar PDF
            </>
          )}
        </button>

        {/* Resultado */}
        {result && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
            <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center">
              <span className="text-xl mr-2">✅</span>
              Resultado do Processamento:
            </h4>
            <div className="space-y-2 text-sm">
              <p><strong className="text-green-700">Método usado:</strong> {result.metodoUsado}</p>
              <p><strong className="text-green-700">Arquivo:</strong> {result.fileName}</p>
              <p><strong className="text-green-700">Status:</strong> 
                <span className="text-green-600 font-semibold">✅ PDF editado baixado automaticamente!</span>
              </p>
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer text-green-700 font-medium hover:text-green-800">
                📄 Ver Texto Extraído
              </summary>
              <pre className="mt-2 p-3 bg-white rounded text-xs text-gray-700 overflow-auto max-h-40">
                {result.textoExtraido}
              </pre>
            </details>
            
            <details className="mt-2">
              <summary className="cursor-pointer text-green-700 font-medium hover:text-green-800">
                ✏️ Ver Texto Editado
              </summary>
              <pre className="mt-2 p-3 bg-white rounded text-xs text-gray-700 overflow-auto max-h-40">
                {result.textoEditado}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
