'use client';

import { useState, useRef, useEffect } from 'react';
import { TextAnnotation } from '../lib/types';

interface TextEditorProps {
  annotation: TextAnnotation;
  onSave: (updatedAnnotation: TextAnnotation) => void;
  onCancel: () => void;
  onDelete: () => void;
  currentTool?: string;
}

export default function TextEditor({ annotation, onSave, onCancel, onDelete, currentTool }: TextEditorProps) {
  const [content, setContent] = useState(annotation.content);
  const [fontSize, setFontSize] = useState(annotation.fontSize || 12);
  const [fontFamily, setFontFamily] = useState(annotation.fontFamily || 'Arial');
  const [color, setColor] = useState(annotation.color || '#000000');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleSave = () => {
    const updatedAnnotation: TextAnnotation = {
      ...annotation,
      content,
      fontSize,
      fontFamily,
      color
    };
    onSave(updatedAnnotation);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Salvar ao pressionar Enter (sem Shift para nova linha)
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // Fechar editor quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.text-editor-container')) {
        // Salvar automaticamente ao clicar fora
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleSave]);

  return (
    <div className="text-editor-container absolute bg-white border-2 border-blue-500 rounded-lg shadow-lg p-2 min-w-[200px] z-50">
      <div className="flex flex-col space-y-2">
        {/* Controles de formatação */}
        <div className="flex space-x-2 text-xs">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-xs"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Helvetica">Helvetica</option>
          </select>
          
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-xs"
          >
            <option value={8}>8px</option>
            <option value={10}>10px</option>
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
            <option value={20}>20px</option>
            <option value={24}>24px</option>
          </select>
          
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
            title="Cor do texto"
          />
        </div>

        {/* Área de texto */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            color,
            minHeight: '60px'
          }}
          placeholder={currentTool === 'edit' ? "Digite o texto para editar..." : "Digite seu texto aqui..."}
        />

        {/* Botões de ação */}
        <div className="flex justify-between space-x-2">
          <div className="flex space-x-1">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Salvar (Ctrl+Enter)
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
            >
              Cancelar (Esc)
            </button>
          </div>
          
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            title="Excluir anotação"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Dica de uso */}
        <div className="text-xs text-gray-500 text-center">
          Enter para salvar • Shift+Enter para nova linha • Esc para cancelar
        </div>
      </div>
    </div>
  );
}