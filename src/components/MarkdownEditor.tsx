'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NotificationService } from '../lib/notifications';

interface MarkdownEditorProps {
  pdfFile: File | null;
  onClose: () => void;
}

export default function MarkdownEditor({ pdfFile, onClose }: MarkdownEditorProps) {
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false); // false = modo de edição
  const [originalMarkdown, setOriginalMarkdown] = useState('');

  // Carregar Markdown do PDF quando o componente é montado
  useEffect(() => {
    if (pdfFile) {
      loadMarkdownFromPDF();
    }
  }, [pdfFile]);

  // Prevenir scroll do body quando modal estiver aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const loadMarkdownFromPDF = async () => {
    if (!pdfFile) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/pdf-markdown-workflow?pdfFile=${encodeURIComponent(pdfFile.name)}`);
      const data = await response.json();
      
      if (response.ok) {
        setMarkdownContent(data.markdown);
        setOriginalMarkdown(data.markdown);
        NotificationService.success('PDF convertido para Markdown com sucesso!');
      } else {
        NotificationService.error(data.error || 'Erro ao converter PDF');
      }
    } catch (error) {
      NotificationService.error('Erro: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsPDF = async () => {
    if (!markdownContent.trim()) {
      NotificationService.warning('Digite algum conteúdo Markdown');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('markdownContent', markdownContent);

      const response = await fetch('/api/pdf-markdown-workflow', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Fazer download do PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pdf_editado_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        NotificationService.success('PDF editado salvo com sucesso!');
      } else {
        const errorData = await response.json();
        NotificationService.error(errorData.error || 'Erro ao salvar PDF');
      }
    } catch (error) {
      NotificationService.error('Erro: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMarkdownContent(originalMarkdown);
    NotificationService.info('Conteúdo resetado para o original');
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdownContent.substring(start, end);
    const newText = prefix + selectedText + suffix;
    
    const newContent = markdownContent.substring(0, start) + newText + markdownContent.substring(end);
    setMarkdownContent(newContent);
    
    // Focar no textarea após inserção
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const renderPreview = () => {
    // Conversão simples de Markdown para HTML
    let html = markdownContent
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br>');

    // Envolver listas em <ul> ou <ol>
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    
    return { __html: html };
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="text-2xl mr-2">📝</span>
              Editor Markdown
            </h2>
            <span className="text-sm text-gray-500">
              {pdfFile?.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                previewMode 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {previewMode ? '✏️ Editar' : '👁️ Visualizar'}
            </button>
            
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
            >
              ❌ Fechar
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => insertMarkdown('# ')}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
              title="Título 1"
            >
              H1
            </button>
            <button
              onClick={() => insertMarkdown('## ')}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
              title="Título 2"
            >
              H2
            </button>
            <button
              onClick={() => insertMarkdown('### ')}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
              title="Título 3"
            >
              H3
            </button>
            <button
              onClick={() => insertMarkdown('**', '**')}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
              title="Negrito"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => insertMarkdown('*', '*')}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
              title="Itálico"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => insertMarkdown('- ')}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
              title="Lista"
            >
              •
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm font-medium hover:bg-yellow-600 transition-colors"
            >
              🔄 Resetar
            </button>
            <button
              onClick={handleSaveAsPDF}
              disabled={loading || !markdownContent.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="mr-2">💾</span>
                  Salvar como PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {previewMode ? (
            /* Preview Mode */
            <div className="flex-1 p-4 overflow-auto bg-white">
              <div className="prose max-w-none">
                <div 
                  className="markdown-preview"
                  dangerouslySetInnerHTML={renderPreview()}
                />
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="flex-1 flex">
              {/* Editor */}
              <div className="flex-1 flex flex-col">
                <div className="p-2 bg-gray-100 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">📝 Editor</span>
                </div>
                <textarea
                  id="markdown-editor"
                  value={markdownContent}
                  onChange={(e) => {
                    console.log('Markdown editado:', e.target.value.length, 'caracteres');
                    setMarkdownContent(e.target.value);
                  }}
                  className="flex-1 p-4 border-0 resize-none focus:outline-none font-mono text-sm"
                  placeholder="Digite seu conteúdo Markdown aqui..."
                  spellCheck={false}
                  readOnly={false}
                />
              </div>
              
              {/* Preview */}
              <div className="w-1/2 border-l border-gray-200 flex flex-col">
                <div className="p-2 bg-gray-100 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">👁️ Preview</span>
                </div>
                <div className="flex-1 p-4 overflow-auto bg-white">
                  <div className="prose max-w-none">
                    <div 
                      className="markdown-preview"
                      dangerouslySetInnerHTML={renderPreview()}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>📄 Caracteres: {markdownContent.length}</span>
              <span>📝 Linhas: {markdownContent.split('\n').length}</span>
              <span>📊 Palavras: {markdownContent.split(/\s+/).filter(w => w.length > 0).length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                💡 Dica: Use **texto** para negrito e *texto* para itálico
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar usando portal para garantir fullscreen
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return null;
}
