'use client';

import { PDFDocument as PDFLibDocument, PDFPage as PDFLibPage, degrees } from 'pdf-lib';
import { PDFDocument as PDFDocumentType, PDFPage, TextAnnotation } from './types';

export class PDFService {
  // Cache para gerenciar instâncias de PDF e evitar vazamentos de memória
  private static pdfCache = new Map<string, any>();
  private static readonly MAX_CACHE_SIZE = 10;
  
  // Force redeploy - fix Vercel cache issue
  /**
   * Carrega um arquivo PDF e retorna um objeto PDFDocument
   */
  static async loadPDF(file: File): Promise<PDFDocumentType> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            throw new Error('Erro ao ler arquivo');
          }

          const pdfDoc = await PDFLibDocument.load(arrayBuffer);
          const pages: PDFPage[] = [];

          for (let i = 0; i < pdfDoc.getPageCount(); i++) {
            const page = pdfDoc.getPage(i);
            const { width, height } = page.getSize();
            
            pages.push({
              id: `page-${Date.now()}-${i}`,
              index: i,
              rotation: 0,
              textAnnotations: [],
              width,
              height
            });
          }

          const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const document: PDFDocumentType = {
            id: documentId,
            name: file.name,
            size: file.size,
            pages,
            file: file,
            pdfDoc // Armazenar a instância do PDFLib para manipulações futuras
          };
          
          // Gerenciar cache de memória
          PDFService.manageCache(documentId, pdfDoc);
          
          resolve(document);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Adiciona uma anotação de texto ao documento
   */
  static addTextAnnotation(
    document: PDFDocumentType, 
    pageIndex: number, 
    text: string, 
    x: number, 
    y: number,
    options: { width?: number; height?: number; fontSize?: number; fontFamily?: string; color?: string } = {}
  ): PDFDocumentType {
    const updatedDocument = { ...document };
    
    if (pageIndex >= 0 && pageIndex < updatedDocument.pages.length) {
      const updatedPages = [...updatedDocument.pages];
      const page = { ...updatedPages[pageIndex] };
      
      // Calcular dimensões baseadas no texto e fonte
      const fontSize = options.fontSize || 12;
      const fontFamily = options.fontFamily || 'Arial';
      
      // Estimar largura baseada no texto (aproximação)
      const estimatedWidth = Math.max(text.length * fontSize * 0.6, 100);
      const estimatedHeight = Math.max(fontSize * 1.2, 20);
      
      const annotation: TextAnnotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: text,
        x: Math.max(0, x), // Garantir que não seja negativo
        y: Math.max(0, y), // Garantir que não seja negativo
        width: options.width || estimatedWidth,
        height: options.height || estimatedHeight,
        fontSize,
        fontFamily,
        color: options.color || '#000000'
      };
      
      page.textAnnotations = [...page.textAnnotations, annotation];
      updatedPages[pageIndex] = page;
      updatedDocument.pages = updatedPages;
    }
    
    return updatedDocument;
  }

  /**
   * Atualiza uma anotação de texto existente
   */
  static updateTextAnnotation(
    document: PDFDocumentType,
    pageIndex: number,
    annotationId: string,
    updates: Partial<TextAnnotation>
  ): PDFDocumentType {
    const updatedDocument = { ...document };
    
    if (pageIndex >= 0 && pageIndex < updatedDocument.pages.length) {
      const updatedPages = [...updatedDocument.pages];
      const page = { ...updatedPages[pageIndex] };
      
      page.textAnnotations = page.textAnnotations.map(annotation =>
        annotation.id === annotationId ? { ...annotation, ...updates } : annotation
      );
      
      updatedPages[pageIndex] = page;
      updatedDocument.pages = updatedPages;
    }
    
    return updatedDocument;
  }

  /**
   * Remove uma anotação de texto
   */
  static removeTextAnnotation(
    document: PDFDocumentType,
    pageIndex: number,
    annotationId: string
  ): PDFDocumentType {
    const updatedDocument = { ...document };
    
    if (pageIndex >= 0 && pageIndex < updatedDocument.pages.length) {
      const updatedPages = [...updatedDocument.pages];
      const page = { ...updatedPages[pageIndex] };
      
      page.textAnnotations = page.textAnnotations.filter(
        annotation => annotation.id !== annotationId
      );
      
      updatedPages[pageIndex] = page;
      updatedDocument.pages = updatedPages;
    }
    
    return updatedDocument;
  }

  /**
   * Rotaciona uma página do documento
   */
  static rotatePage(document: PDFDocumentType, pageIndex: number, rotation: number): PDFDocumentType {
    const updatedDocument = { ...document };
    
    if (pageIndex >= 0 && pageIndex < updatedDocument.pages.length) {
      const updatedPages = [...updatedDocument.pages];
      const page = { ...updatedPages[pageIndex] };
      
      // Normaliza a rotação para estar entre 0 e 270 (em incrementos de 90)
      page.rotation = ((page.rotation + rotation) % 360);
      
      updatedPages[pageIndex] = page;
      updatedDocument.pages = updatedPages;
    }
    
    return updatedDocument;
  }

  /**
   * Remove uma página do documento
   */
  static removePage(document: PDFDocumentType, pageIndex: number): PDFDocumentType {
    const updatedDocument = { ...document };
    
    if (pageIndex >= 0 && pageIndex < updatedDocument.pages.length) {
      const updatedPages = [...updatedDocument.pages];
      updatedPages.splice(pageIndex, 1);
      
      // Atualiza os índices das páginas restantes
      updatedDocument.pages = updatedPages.map((page, index) => ({
        ...page,
        index
      }));
    }
    
    return updatedDocument;
  }

  /**
   * Reordena as páginas do documento
   */
  static reorderPages(document: PDFDocumentType, fromIndex: number, toIndex: number): PDFDocumentType {
    const updatedDocument = { ...document };
    
    if (
      fromIndex >= 0 && 
      fromIndex < updatedDocument.pages.length &&
      toIndex >= 0 && 
      toIndex < updatedDocument.pages.length
    ) {
      const updatedPages = [...updatedDocument.pages];
      const [movedPage] = updatedPages.splice(fromIndex, 1);
      updatedPages.splice(toIndex, 0, movedPage);
      
      // Atualiza os índices das páginas
      updatedDocument.pages = updatedPages.map((page, index) => ({
        ...page,
        index
      }));
    }
    
    return updatedDocument;
  }

  /**
   * Move uma página de um documento para outro
   */
  static movePageBetweenDocuments(
    sourceDocument: PDFDocumentType,
    targetDocument: PDFDocumentType,
    sourcePageIndex: number,
    targetPageIndex: number
  ): { sourceDocument: PDFDocumentType; targetDocument: PDFDocumentType } {
    if (sourcePageIndex < 0 || sourcePageIndex >= sourceDocument.pages.length) {
      return { sourceDocument, targetDocument };
    }

    const sourcePages = [...sourceDocument.pages];
    const targetPages = [...targetDocument.pages];
    
    const [movedPage] = sourcePages.splice(sourcePageIndex, 1);
    targetPages.splice(targetPageIndex, 0, movedPage);
    
    // Atualiza os índices das páginas
    const updatedSourcePages = sourcePages.map((page, index) => ({ ...page, index }));
    const updatedTargetPages = targetPages.map((page, index) => ({ ...page, index }));
    
    return {
      sourceDocument: { ...sourceDocument, pages: updatedSourcePages },
      targetDocument: { ...targetDocument, pages: updatedTargetPages }
    };
  }

  /**
   * Gera um novo arquivo PDF com as modificações aplicadas
   */
  static async generatePDF(documents: PDFDocumentType[]): Promise<Blob> {
    try {
      const pdfDoc = await PDFLibDocument.create();
      
      for (const document of documents) {
        if (document.pdfDoc) {
          const pageCount = document.pdfDoc.getPageCount();
          
          for (let i = 0; i < pageCount; i++) {
            const [copiedPage] = await pdfDoc.copyPages(document.pdfDoc, [i]);
            pdfDoc.addPage(copiedPage);
            
            // Aplicar rotação se necessário
            const page = document.pages[i];
            if (page && page.rotation !== 0) {
              const pdfPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
              // Usar a função degrees do pdf-lib para converter a rotação
              pdfPage.setRotation(degrees(page.rotation));
            }
            
            // Nota: As anotações de texto são mantidas apenas na interface
            // Para incluir anotações no PDF final, seria necessário uma implementação mais complexa
            // Por enquanto, o PDF gerado contém apenas as páginas originais com rotações aplicadas
          }
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      const buffer = new ArrayBuffer(pdfBytes.length);
      const view = new Uint8Array(buffer);
      view.set(pdfBytes);
      return new Blob([buffer], { type: 'application/pdf' });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar PDF final');
    }
  }

  /**
   * Baixa o PDF gerado
   */
  static downloadPDF(blob: Blob, filename: string = 'documento-compilado.pdf'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Gera uma miniatura de uma página do PDF
   */
  static async generatePageThumbnail(
    document: PDFDocumentType, 
    pageIndex: number, 
    maxWidth: number = 200
  ): Promise<string> {
    // Esta funcionalidade seria implementada com react-pdf ou pdf.js
    // Por enquanto, retorna uma URL de placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${maxWidth}" height="${maxWidth * 1.4}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">
          Página ${pageIndex + 1}
        </text>
      </svg>
    `)}`;
  }

  /**
   * Extrai texto de uma página do PDF preservando posicionamento e estilo
   */
  static async extractTextWithStyle(
    document: PDFDocumentType,
    pageIndex: number
  ): Promise<Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    color: string;
  }>> {
    // Esta funcionalidade seria implementada com pdf.js para extrair texto com metadados
    // Por enquanto, retorna um array vazio
    return [];
  }

  /**
   * Aplica texto extraído como anotações preservando o estilo original
   */
  static applyExtractedTextAsAnnotations(
    document: PDFDocumentType,
    pageIndex: number,
    extractedText: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
      fontFamily: string;
      color: string;
    }>
  ): PDFDocumentType {
    const updatedDocument = { ...document };
    
    if (pageIndex >= 0 && pageIndex < updatedDocument.pages.length) {
      const updatedPages = [...updatedDocument.pages];
      const page = { ...updatedPages[pageIndex] };
      
      // Converter texto extraído em anotações
      const annotations: TextAnnotation[] = extractedText.map((item, index) => ({
        id: `extracted-${Date.now()}-${index}`,
        content: item.text,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        fontSize: item.fontSize,
        fontFamily: item.fontFamily,
        color: item.color
      }));
      
      page.textAnnotations = [...page.textAnnotations, ...annotations];
      updatedPages[pageIndex] = page;
      updatedDocument.pages = updatedPages;
    }
    
    return updatedDocument;
  }

  /**
   * Gerencia o cache de PDFs para evitar vazamentos de memória
   */
  private static manageCache(documentId: string, pdfDoc: any): void {
    // Limpar cache se exceder o tamanho máximo
    if (PDFService.pdfCache.size >= PDFService.MAX_CACHE_SIZE) {
      const firstKey = PDFService.pdfCache.keys().next().value;
      PDFService.pdfCache.delete(firstKey);
    }
    
    // Adicionar ao cache
    PDFService.pdfCache.set(documentId, pdfDoc);
  }

  /**
   * Limpa uma instância específica do PDF da memória
   */
  static cleanupDocument(documentId: string): void {
    PDFService.pdfCache.delete(documentId);
  }

  /**
   * Limpa todo o cache de PDFs
   */
  static clearCache(): void {
    PDFService.pdfCache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  static getCacheStats(): { size: number; maxSize: number } {
    return {
      size: PDFService.pdfCache.size,
      maxSize: PDFService.MAX_CACHE_SIZE
    };
  }
}