import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorar se estiver digitando em um input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    shortcuts.forEach(({ key, ctrlKey, shiftKey, altKey, metaKey, action }) => {
      const matchesKey = event.key.toLowerCase() === key.toLowerCase();
      const matchesCtrl = !!ctrlKey === event.ctrlKey;
      const matchesShift = !!shiftKey === event.shiftKey;
      const matchesAlt = !!altKey === event.altKey;
      const matchesMeta = !!metaKey === event.metaKey;

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
        event.preventDefault();
        action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Hook específico para shortcuts do Fênix PDF
export const useFenixShortcuts = (callbacks: {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onOpen?: () => void;
  onSelectTool?: (tool: string) => void;
  onDelete?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'z',
      ctrlKey: true,
      action: () => callbacks.onUndo?.(),
      description: 'Desfazer última ação'
    },
    {
      key: 'y',
      ctrlKey: true,
      action: () => callbacks.onRedo?.(),
      description: 'Refazer última ação'
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => callbacks.onSave?.(),
      description: 'Salvar e baixar PDF'
    },
    {
      key: 'o',
      ctrlKey: true,
      action: () => callbacks.onOpen?.(),
      description: 'Abrir arquivos'
    },
    {
      key: '1',
      ctrlKey: true,
      action: () => callbacks.onSelectTool?.('select'),
      description: 'Ferramenta Selecionar'
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => callbacks.onSelectTool?.('text'),
      description: 'Ferramenta Adicionar Texto'
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => callbacks.onSelectTool?.('edit'),
      description: 'Ferramenta Editar Texto'
    },
    {
      key: 'Delete',
      action: () => callbacks.onDelete?.(),
      description: 'Excluir seleção'
    }
  ];

  useKeyboardShortcuts(shortcuts);
};
