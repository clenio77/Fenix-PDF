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

export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  pages: PDFPage[];
  file: File;
  pdfDoc?: any; // Instância do PDFLib para manipulações
}

export interface PDFEngineState {
  documents: PDFDocument[];
  currentPageIndex: number;
  currentTool: string;
}