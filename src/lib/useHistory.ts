import { useState, useCallback } from 'react';
import { PDFDocument } from './types';

interface HistoryAction {
  id: string;
  type: 'add_text' | 'edit_text' | 'delete_text' | 'rotate_page' | 'delete_page' | 'reorder_pages' | 'move_page';
  timestamp: number;
  description: string;
  data: any;
  undo: () => void;
  redo: () => void;
}

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  const addAction = useCallback((action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
    if (isUndoRedo) return;

    const newAction: HistoryAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // Remove ações futuras se estamos no meio do histórico
      const newHistory = prev.slice(0, currentIndex + 1);
      // Limita o histórico a 50 ações
      const limitedHistory = newHistory.slice(-49);
      return [...limitedHistory, newAction];
    });

    setCurrentIndex(prev => Math.min(prev + 1, 49));
  }, [currentIndex, isUndoRedo]);

  const undo = useCallback(() => {
    if (currentIndex >= 0 && history[currentIndex]) {
      setIsUndoRedo(true);
      history[currentIndex].undo();
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsUndoRedo(false), 100);
    }
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1 && history[currentIndex + 1]) {
      setIsUndoRedo(true);
      history[currentIndex + 1].redo();
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsUndoRedo(false), 100);
    }
  }, [currentIndex, history]);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    addAction,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: history.length,
    currentIndex: currentIndex + 1,
  };
};
