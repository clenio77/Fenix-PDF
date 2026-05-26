'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Tesseract from 'tesseract.js';
import { PDFDocument as PDFDocumentType } from '../lib/types';
import { NotificationService } from '../lib/notifications';
import { ExtractedLawData } from '../app/api/extract-fields/route';

interface ScannerExtractorProps {
  documents: PDFDocumentType[];
  selectedPageIndex: number | null;
  onDocumentsUpdate: (documents: PDFDocumentType[]) => void;
}

export default function ScannerExtractor({
  documents,
  selectedPageIndex,
  onDocumentsUpdate
}: ScannerExtractorProps) {
  const [currentDocument, setCurrentDocument] = useState<PDFDocumentType | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  
  // Estados do Scanner e Filtros
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [binarize, setBinarize] = useState<boolean>(false);
  const [binarizeThreshold, setBinarizeThreshold] = useState<number>(128);
  const [contrast, setContrast] = useState<number>(100);
  const [brightness, setBrightness] = useState<number>(100);
  
  // Estados de Processamento
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStage, setProcessStage] = useState<'idle' | 'rendering' | 'ocr' | 'ai'>('idle');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>('');
  
  // Estado dos Metadados Extraídos
  const [metadata, setMetadata] = useState<ExtractedLawData | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'info' | 'resumo' | 'texto'>('info');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Encontrar o documento e página atuais com base na seleção global
  useEffect(() => {
    if (documents.length === 0) {
      setCurrentDocument(null);
      setTotalPages(0);
      setCurrentPage(1);
      return;
    }

    if (selectedPageIndex !== null) {
      let pageCount = 0;
      for (const doc of documents) {
        if (selectedPageIndex >= pageCount && selectedPageIndex < pageCount + doc.pages.length) {
          setCurrentDocument(doc);
          setCurrentPage(selectedPageIndex - pageCount + 1);
          setTotalPages(doc.pages.length);
          break;
        }
        pageCount += doc.pages.length;
      }
    } else {
      setCurrentDocument(documents[0]);
      setCurrentPage(1);
      setTotalPages(documents[0].pages.length);
    }
  }, [documents, selectedPageIndex]);

  // Aplicar filtros de imagem no canvas renderizado pelo react-pdf
  const applyFilters = () => {
    // Procuramos o canvas gerado pelo react-pdf dentro do container
    const pdfCanvas = containerRef.current?.querySelector('canvas');
    if (!pdfCanvas || !canvasRef.current) return;

    const displayCanvas = canvasRef.current;
    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    // Sincronizar tamanhos
    displayCanvas.width = pdfCanvas.width;
    displayCanvas.height = pdfCanvas.height;

    // Desenhar a página original
    ctx.drawImage(pdfCanvas, 0, 0);

    // Obter dados da imagem para manipular pixels
    const imgData = ctx.getImageData(0, 0, displayCanvas.width, displayCanvas.height);
    const data = imgData.data;

    // Aplicar filtros
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Ajuste de contraste
      if (contrast !== 100) {
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }

      // Ajuste de brilho
      if (brightness !== 100) {
        const factor = brightness / 100;
        r = r * factor;
        g = g * factor;
        b = b * factor;
      }

      // Tons de cinza
      if (grayscale || binarize) {
        // Luminância clássica
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        if (binarize) {
          // Binarização Preto & Branco Puro
          const val = gray >= binarizeThreshold ? 255 : 0;
          r = val;
          g = val;
          b = val;
        } else {
          r = gray;
          g = gray;
          b = gray;
        }
      }

      // Garantir limites 0-255
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // Re-aplicar filtros quando mudam
  useEffect(() => {
    // Pequeno timeout para dar tempo da página do react-pdf renderizar
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, grayscale, binarize, binarizeThreshold, contrast, brightness, zoom, currentDocument]);

  // Função para executar OCR ou Extração de Texto Nativo
  const handleExtractAndProcess = async () => {
    if (!currentDocument) return;

    setIsProcessing(true);
    setOcrProgress(0);
    setMetadata(null);

    let docText = '';

    try {
      // ETAPA 1: Tentar extrair texto nativo primeiro usando pdfjs
      setProcessStage('rendering');
      
      const fileBuffer = await currentDocument.file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: fileBuffer }).promise;
      
      // Iremos processar a página atual do visualizador
      const pageNum = currentPage;
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const nativeText = textContent.items.map((item: any) => item.str).join(' ');

      if (nativeText && nativeText.trim().length > 100) {
        // PDF estruturado com texto nativo viável
        console.log('Utilizando texto nativo do PDF');
        docText = nativeText;
      } else {
        // PDF digitalizado/escaneado - Executar OCR com Tesseract.js
        setProcessStage('ocr');
        console.log('PDF sem texto nativo. Executando OCR com Tesseract.js...');
        
        const canvas = canvasRef.current || containerRef.current?.querySelector('canvas');
        if (!canvas) {
          throw new Error('Elemento de visualização do documento não encontrado para digitalização.');
        }

        const dataUrl = canvas.toDataURL('image/png');
        
        const result = await Tesseract.recognize(dataUrl, 'por', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        });

        docText = result.data.text;
      }

      if (!docText || docText.trim().length === 0) {
        throw new Error('Nenhum texto pôde ser detectado na página selecionada.');
      }

      setExtractedText(docText);

      // ETAPA 2: Extração Semântica com o Gemini (Backend)
      setProcessStage('ai');
      
      const response = await fetch('/api/extract-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: docText })
      });

      if (!response.ok) {
        throw new Error(`Serviço de análise jurídica retornou erro status ${response.status}`);
      }

      const responseData = await response.json();
      setMetadata(responseData.data);
      setIsSimulated(responseData.isSimulated);

      if (responseData.isSimulated) {
        NotificationService.warning(
          responseData.message || 'Chave do Gemini não configurada. Usando metadados simulados.'
        );
      } else {
        NotificationService.success('Metadados jurídicos extraídos com sucesso via Gemini!');
      }

    } catch (err) {
      console.error(err);
      NotificationService.error(err instanceof Error ? err.message : 'Falha na extração automática de dados');
    } finally {
      setIsProcessing(false);
      setProcessStage('idle');
    }
  };

  // Alterar campo de metadados manualmente
  const handleMetaChange = (field: string, val: string, subField?: string) => {
    if (!metadata) return;

    if (subField) {
      setMetadata({
        ...metadata,
        [field]: {
          ...(metadata[field as keyof ExtractedLawData] as Record<string, string>),
          [subField]: val
        }
      });
    } else {
      setMetadata({
        ...metadata,
        [field]: val
      });
    }
  };

  // Copiar campo de texto
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    NotificationService.success(`${label} copiado para a área de transferência!`);
  };

  // Copiar todos os metadados como JSON
  const copyAllAsJson = () => {
    if (!metadata) return;
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    NotificationService.success('Todos os metadados copiados em formato JSON!');
  };

  // Exportar Relatório como Markdown e baixar
  const exportAsMarkdown = () => {
    if (!metadata) return;

    const md = `# Relatório de Análise Jurídica - Fênix PDF
*Gerado em: ${new Date().toLocaleString('pt-BR')}*
*Arquivo: ${currentDocument?.name || 'N/A'} - Página ${currentPage}*

---

## 📂 Informações Estruturadas do Processo

- **Número do Processo:** ${metadata.numeroProcesso || 'Não identificado'}
- **Tribunal / Órgão Julgador:** ${metadata.tribunal || 'Não identificado'}
- **Classe Processual:** ${metadata.classeProcessual || 'Não identificado'}
- **Assunto:** ${metadata.assunto || 'Não identificado'}
- **Magistrado Relator:** ${metadata.magistradoRelator || 'Não identificado'}
- **Valor da Causa / Condenação:** ${metadata.valorCausa || 'Não informado'}

### 👥 Partes e Representantes
- **Autor/Requerente:** ${metadata.partes.autor || 'Não identificado'}
- **Réu/Requerido:** ${metadata.partes.reu || 'Não identificado'}
- **Outros Interessados:** ${metadata.partes.outros || 'Nenhum'}
- **Advogados / OAB:** ${metadata.advogadosOab || 'Não identificados'}

### 📅 Cronologia Processual
- **Data de Distribuição:** ${metadata.datasRelevantes.distribuicao || 'Não informada'}
- **Data da Decisão:** ${metadata.datasRelevantes.decisao || 'Não informada'}
- **Data de Publicação:** ${metadata.datasRelevantes.publicacao || 'Não informada'}

---

## 📝 Ementa / Resumo da Decisão
\`\`\`text
${metadata.ementa || 'Sem ementa disponível.'}
\`\`\`

## ⚖️ Dispositivo / Conclusão Decisória
\`\`\`text
${metadata.dispositivo || 'Sem dispositivo disponível.'}
\`\`\`
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-processo-${metadata.numeroProcesso || 'geral'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    NotificationService.success('Relatório em Markdown baixado com sucesso!');
  };

  // Renomear o arquivo original com base nos dados extraídos
  const renameFileIntelligently = () => {
    if (!metadata || !currentDocument) return;

    const autorRef = metadata.partes.autor ? metadata.partes.autor.split(',')[0].split(' ')[0] : 'AUTOR';
    const reuRef = metadata.partes.reu ? metadata.partes.reu.split(',')[0].split(' ')[0] : 'REU';
    const cnjRef = metadata.numeroProcesso ? metadata.numeroProcesso.replace(/[^\d]/g, '').substring(0, 15) : Date.now();
    const classeRef = metadata.classeProcessual ? metadata.classeProcessual.substring(0, 15) : 'PETICAO';

    const cleanName = `${classeRef.toUpperCase()}_Proc_${cnjRef}_${autorRef.toUpperCase()}_x_${reuRef.toUpperCase()}.pdf`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\-.]/g, '');

    const renamedFile = new File([currentDocument.file], cleanName, { type: 'application/pdf' });
    
    const updatedDocument = {
      ...currentDocument,
      name: cleanName,
      file: renamedFile
    };

    const updatedDocs = documents.map(doc => 
      doc.id === currentDocument.id ? updatedDocument : doc
    );

    onDocumentsUpdate(updatedDocs);
    NotificationService.success(`Arquivo renomeado com sucesso para: ${cleanName}`);
  };

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400 bg-gray-900/50 rounded-2xl border border-gray-800">
        <div className="text-center p-8">
          <span className="text-5xl block mb-4">🔍</span>
          <h3 className="text-lg font-bold text-white mb-2">Nenhum PDF selecionado</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Faça upload de um arquivo PDF no painel lateral e selecione uma página para ativar o Scanner e a Extração de Dados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      
      {/* COLUNA ESQUERDA: Scanner & Visualização da Página */}
      <div className="xl:col-span-6 flex flex-col space-y-4">
        
        {/* Painel de Filtros e Controles do Scanner */}
        <div className="card border-slate-700 bg-slate-900 p-5 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center">
              <span className="mr-2 text-indigo-400">⚙️</span>
              Filtros do Scanner de Documentos
            </h3>
            <button
              onClick={() => {
                setGrayscale(false);
                setBinarize(false);
                setContrast(100);
                setBrightness(100);
              }}
              className="text-xs text-gray-400 hover:text-indigo-400 transition-colors"
            >
              Resetar Filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-300">
            {/* Opções Booleanas */}
            <div className="flex flex-col space-y-3 justify-center">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={grayscale}
                  disabled={binarize}
                  onChange={(e) => setGrayscale(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Converter para Tons de Cinza</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={binarize}
                  onChange={(e) => {
                    setBinarize(e.target.checked);
                    if (e.target.checked) setGrayscale(true);
                  }}
                  className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-semibold text-indigo-300">Alto Contraste Preto & Branco</span>
              </label>
            </div>

            {/* Threshold de Binarização */}
            {binarize && (
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between">
                  <span>Limiar de Preto e Branco:</span>
                  <span className="font-mono text-indigo-400">{binarizeThreshold}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={binarizeThreshold}
                  onChange={(e) => setBinarizeThreshold(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Brilho e Contraste */}
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between">
                <span>Ajuste de Contraste:</span>
                <span className="font-mono">{contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex justify-between">
                <span>Ajuste de Brilho:</span>
                <span className="font-mono">{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Visualização de Visualizador / Canvas Filtrado */}
        <div className="card flex-1 border-slate-700 bg-slate-900 rounded-2xl overflow-hidden flex flex-col min-h-[450px]">
          {/* Header do visualizador */}
          <div className="bg-slate-950 px-4 py-3 flex justify-between items-center border-b border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white truncate max-w-[200px]" title={currentDocument.name}>
                {currentDocument.name}
              </span>
              <span className="bg-slate-800 text-gray-400 px-2 py-0.5 rounded-full">
                Pág {currentPage}/{totalPages}
              </span>
            </div>
            
            {/* Controles de Zoom */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
                className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors"
              >
                -
              </button>
              <span className="w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
                className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Área do Documento com Canvas de Visualização Filtrado */}
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-950 relative">
            
            {/* Efeito de feixe de Scanner (Linha laser verde passando) */}
            {isProcessing && (
              <div className="absolute left-0 right-0 w-full h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] z-20 animate-[scan_2s_ease-in-out_infinite]" />
            )}

            {/* Elemento de renderização oculto do PDF original */}
            <div ref={containerRef} className="hidden">
              <Document
                file={currentDocument.file}
                loading={null}
              >
                <Page
                  pageNumber={currentPage}
                  scale={zoom * 1.5} // Renderizar em alta qualidade no canvas oculto
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>

            {/* Canvas de Display Filtrado */}
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto bg-white rounded-lg shadow-2xl transition-transform"
              style={{ display: 'block' }}
            />
          </div>

          {/* Ação de Processamento do Scanner */}
          <div className="bg-slate-950 p-4 border-t border-slate-800 text-center">
            <button
              onClick={handleExtractAndProcess}
              disabled={isProcessing}
              className="btn w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 hover:scale-[1.02] flex items-center justify-center space-x-2 py-4"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>
                    {processStage === 'rendering' && 'Extraindo texto nativo...'}
                    {processStage === 'ocr' && `Digitalizando com OCR (${ocrProgress}%)`}
                    {processStage === 'ai' && 'Extraindo metadados com Gemini...'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl">⚡</span>
                  <span className="font-semibold">Escanear Página e Extrair Campos com IA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: Painel de Metadados Extraídos */}
      <div className="xl:col-span-6 flex flex-col">
        
        {/* Painel do Extrator */}
        <div className="card flex-1 border-slate-700 bg-slate-900 rounded-2xl flex flex-col min-h-[550px]">
          
          <div className="card-header bg-slate-950 flex flex-col space-y-3 pb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-white flex items-center">
                <span className="text-lg mr-2">⚖️</span>
                Campos Jurídicos Extraídos
                {isSimulated && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
                    Simulado
                  </span>
                )}
              </h2>
              {metadata && (
                <div className="flex space-x-2">
                  <button
                    onClick={renameFileIntelligently}
                    className="px-3 py-1.5 bg-slate-800 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center"
                    title="Renomear o arquivo local automaticamente"
                  >
                    ✏️ Organizar Nome
                  </button>
                  <button
                    onClick={exportAsMarkdown}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all shadow-md"
                  >
                    📥 Exportar MD
                  </button>
                </div>
              )}
            </div>

            {/* Navegação entre abas */}
            <div className="flex space-x-1 p-0.5 bg-slate-900 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'info'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                📋 Dados Processuais
              </button>
              <button
                onClick={() => setActiveTab('resumo')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'resumo'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                📝 Ementa & Decisão
              </button>
              <button
                onClick={() => setActiveTab('texto')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'texto'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                📄 Texto Bruto
              </button>
            </div>
          </div>

          <div className="card-body flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-900/40">
            {metadata ? (
              <div className="space-y-5">
                
                {/* ABA 1: DADOS DO PROCESSO */}
                {activeTab === 'info' && (
                  <div className="space-y-4 animate-fade-in text-sm text-gray-200">
                    
                    {/* Linha 1: Processo e Tribunal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-semibold text-indigo-400">NÚMERO DO PROCESSO</label>
                          <button
                            onClick={() => copyToClipboard(metadata.numeroProcesso, 'Número do processo')}
                            className="text-xxs text-gray-500 hover:text-white"
                          >
                            Copiar
                          </button>
                        </div>
                        <input
                          type="text"
                          value={metadata.numeroProcesso}
                          onChange={(e) => handleMetaChange('numeroProcesso', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-semibold text-indigo-400">TRIBUNAL / ÓRGÃO</label>
                          <button
                            onClick={() => copyToClipboard(metadata.tribunal, 'Tribunal')}
                            className="text-xxs text-gray-500 hover:text-white"
                          >
                            Copiar
                          </button>
                        </div>
                        <input
                          type="text"
                          value={metadata.tribunal}
                          onChange={(e) => handleMetaChange('tribunal', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Linha 2: Classe e Assunto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-400 mb-1">CLASSE PROCESSUAL</label>
                        <input
                          type="text"
                          value={metadata.classeProcessual}
                          onChange={(e) => handleMetaChange('classeProcessual', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-400 mb-1">ASSUNTO PRINCIPAL</label>
                        <input
                          type="text"
                          value={metadata.assunto}
                          onChange={(e) => handleMetaChange('assunto', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Linha 3: Partes (Autor e Réu) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-400 mb-1">AUTOR / REQUERENTE</label>
                        <input
                          type="text"
                          value={metadata.partes.autor}
                          onChange={(e) => handleMetaChange('partes', e.target.value, 'autor')}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-red-400 mb-1">RÉU / REQUERIDO</label>
                        <input
                          type="text"
                          value={metadata.partes.reu}
                          onChange={(e) => handleMetaChange('partes', e.target.value, 'reu')}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Linha 4: Advogados/OAB e Juiz/Relator */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-400 mb-1">ADVOGADOS E OAB</label>
                        <input
                          type="text"
                          value={metadata.advogadosOab}
                          onChange={(e) => handleMetaChange('advogadosOab', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-400 mb-1">MAGISTRADO / RELATOR</label>
                        <input
                          type="text"
                          value={metadata.magistradoRelator}
                          onChange={(e) => handleMetaChange('magistradoRelator', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Linha 5: Datas e Valor */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-400 mb-1">DISTRIBUIÇÃO</label>
                        <input
                          type="text"
                          value={metadata.datasRelevantes.distribuicao}
                          onChange={(e) => handleMetaChange('datasRelevantes', e.target.value, 'distribuicao')}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-400 mb-1">DECISÃO/SENTENÇA</label>
                        <input
                          type="text"
                          value={metadata.datasRelevantes.decisao}
                          onChange={(e) => handleMetaChange('datasRelevantes', e.target.value, 'decisao')}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-400 mb-1">VALOR CAUSA / CONDENAÇÃO</label>
                        <input
                          type="text"
                          value={metadata.valorCausa}
                          onChange={(e) => handleMetaChange('valorCausa', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 2: RESUMO E DISPOSITIVO */}
                {activeTab === 'resumo' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-semibold text-indigo-400">EMENTA / RESUMO JURÍDICO</label>
                        <button
                          onClick={() => copyToClipboard(metadata.ementa, 'Resumo')}
                          className="text-xxs text-gray-500 hover:text-white"
                        >
                          Copiar
                        </button>
                      </div>
                      <textarea
                        rows={6}
                        value={metadata.ementa}
                        onChange={(e) => handleMetaChange('ementa', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-y"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-semibold text-indigo-400">DISPOSITIVO / CONCLUSÃO DECISÓRIA</label>
                        <button
                          onClick={() => copyToClipboard(metadata.dispositivo, 'Dispositivo')}
                          className="text-xxs text-gray-500 hover:text-white"
                        >
                          Copiar
                        </button>
                      </div>
                      <textarea
                        rows={5}
                        value={metadata.dispositivo}
                        onChange={(e) => handleMetaChange('dispositivo', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-y"
                      />
                    </div>
                  </div>
                )}

                {/* ABA 3: TEXTO BRUTO */}
                {activeTab === 'texto' && (
                  <div className="space-y-2 animate-fade-in h-full flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Texto bruto capturado da página</span>
                      <button
                        onClick={() => copyToClipboard(extractedText, 'Texto bruto')}
                        className="px-3 py-1 bg-slate-800 text-gray-300 rounded hover:bg-slate-700 transition-colors text-xs"
                      >
                        Copiar Tudo
                      </button>
                    </div>
                    <textarea
                      rows={14}
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="w-full flex-grow bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-gray-300 text-xs font-mono focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                )}

                {/* Botões do Rodapé de Metadados */}
                <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-6">
                  <span className="text-xs text-gray-500">
                    💡 Edite qualquer campo para ajustar as informações antes de exportar.
                  </span>
                  <button
                    onClick={copyAllAsJson}
                    className="px-4 py-2 bg-slate-800 text-gray-300 rounded-xl text-xs hover:bg-slate-700 transition-all font-semibold"
                  >
                    📋 Copiar JSON Completo
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-16">
                <span className="text-5xl mb-4">⚡</span>
                <h3 className="text-sm font-semibold text-white mb-1">Pronto para Análise</h3>
                <p className="text-xs text-gray-500 text-center max-w-xs leading-relaxed">
                  Clique no botão azul à esquerda para digitalizar o documento atual, rodar o OCR inteligente e solicitar ao Gemini a extração estruturada dos 11 campos jurídicos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
