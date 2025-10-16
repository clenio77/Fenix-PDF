export interface PDFPage {
  id: string;
  index: number;
  rotation: number;
  textAnnotations: TextAnnotation[];
  width: number;
  height: number;
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

/**
 * --- CORREÇÃO DA TIPAGEM ---
 * A propriedade `pdfDoc` foi removida. A instância de `pdf-lib` não deve ser
 * mantida no estado da aplicação. Ela será carregada sob demanda pelas
 * funções de manipulação no PDFService quando necessário.
 * A fonte da verdade é o objeto `File`.
 */
export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  pages: PDFPage[]; // Pode ser populado progressivamente
  file: File;
}

export interface PDFEngineState {
  documents: PDFDocument[];
  currentPageIndex: number;
  currentTool: string;
}