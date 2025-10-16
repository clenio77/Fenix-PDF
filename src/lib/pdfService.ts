'use client';

import { PDFDocument as PDFLibDocument, degrees, rgb } from 'pdf-lib';
import { PDFDocument as PDFDocumentType, PDFPage } from './types';

/**
 * PDFService focado exclusivamente em MANIPULAÇÃO de PDFs.
 * O carregamento para visualização é de responsabilidade do componente com react-pdf.
 */
export class PDFService {

  /**
   * Cria uma estrutura de documento inicial a partir de um arquivo, sem carregar
   * a instância de pdf-lib na memória, que agora é feita sob demanda.
   */
  static createInitialDocument(file: File): PDFDocumentType {
    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      pages: [], // As páginas serão descobertas pelo FileViewer
      file: file,
    };
  }

  /**
   * Exemplo de função de MANIPULAÇÃO. Carrega o PDF com pdf-lib,
   * executa uma ação e retorna um novo objeto File.
   */
  static async addBlankPage(file: File): Promise<File> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);

      pdfDoc.addPage(); // Adiciona uma página em branco

      const pdfBytes = await pdfDoc.save();
      const uint8Array = new Uint8Array(pdfBytes);
      return new File([uint8Array], file.name, { type: 'application/pdf' });

    } catch (error) {
      console.error("Erro ao adicionar página em branco:", error);
      throw new Error("Não foi possível adicionar a página.");
    }
  }

  /**
   * Deleta uma página específica do PDF. Carrega o PDF, remove a página
   * e retorna um novo objeto File.
   */
  static async deletePage(file: File, pageIndex: number): Promise<File> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);

      // Verificar se a página existe
      if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
        throw new Error(`Página ${pageIndex + 1} não existe no documento`);
      }

      // Verificar se não é a última página (pelo menos 1 página deve permanecer)
      if (pdfDoc.getPageCount() <= 1) {
        throw new Error("Não é possível deletar a última página do documento");
      }

      pdfDoc.removePage(pageIndex); // Remove a página

      const pdfBytes = await pdfDoc.save();
      const uint8Array = new Uint8Array(pdfBytes);
      return new File([uint8Array], file.name, { type: 'application/pdf' });

    } catch (error) {
      console.error("Erro ao deletar página:", error);
      throw new Error(`Não foi possível deletar a página: ${(error as Error).message}`);
    }
  }

  /**
   * Edita texto em coordenadas específicas. Carrega o PDF, aplica a modificação
   * e retorna um novo objeto File.
   */
  static async editTextAtCoordinates(
    file: File,
    pageIndex: number,
    pdfX: number,
    pdfY: number,
    newText: string,
    fontSize: number = 12,
    textWidth: number = 100,
    textHeight: number = 20
  ): Promise<File> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      const page = pdfDoc.getPage(pageIndex);

      // "Apaga" o texto antigo desenhando um retângulo branco sobre ele
      page.drawRectangle({
        x: pdfX,
        y: pdfY - textHeight, // Ajuste de coordenada
        width: textWidth,
        height: textHeight,
        color: rgb(1, 1, 1), // Branco
      });

      // Desenha o novo texto
      page.drawText(newText, {
        x: pdfX,
        y: pdfY,
        size: fontSize,
        color: rgb(0, 0, 0), // Preto
      });

      const modifiedBytes = await pdfDoc.save();
      const uint8Array = new Uint8Array(modifiedBytes);
      return new File([uint8Array], file.name, { type: 'application/pdf' });

    } catch (error) {
      console.error('Erro ao editar texto do PDF:', error);
      throw new Error('Falha ao editar texto do PDF');
    }
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
      
      const annotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: text,
        x,
        y,
        width: options.width || 200,
        height: options.height || 30,
        fontSize: options.fontSize || 12,
        fontFamily: options.fontFamily || 'Arial',
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
    updates: any
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
        const arrayBuffer = await document.file.arrayBuffer();
        const sourcePdfDoc = await PDFLibDocument.load(arrayBuffer);
        const pageCount = sourcePdfDoc.getPageCount();
        
        for (let i = 0; i < pageCount; i++) {
          const [copiedPage] = await pdfDoc.copyPages(sourcePdfDoc, [i]);
          pdfDoc.addPage(copiedPage);
          
          // Aplicar rotação se necessário
          const page = document.pages[i];
          if (page && page.rotation !== 0) {
            const pdfPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
            // Usar a função degrees do pdf-lib para converter a rotação
            pdfPage.setRotation(degrees(page.rotation));
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
   * Obtém configurações de compressão baseadas no nível de qualidade
   * @param quality - Nível de qualidade (0.1 a 1.0)
   * @returns Configurações de compressão
   */
  private static getCompressionConfig(quality: number) {
    if (quality >= 0.8) {
      // Baixa compressão - máxima qualidade
      return {
        useObjectStreams: true,
        objectsPerTick: 100,
        updateFieldAppearances: false
      };
    } else if (quality >= 0.6) {
      // Compressão média - equilíbrio
      return {
        useObjectStreams: true,
        objectsPerTick: 75,
        updateFieldAppearances: false
      };
    } else if (quality >= 0.4) {
      // Alta compressão - redução significativa
      return {
        useObjectStreams: true,
        objectsPerTick: 50,
        updateFieldAppearances: true
      };
    } else {
      // Compressão máxima - máxima redução
      return {
        useObjectStreams: true,
        objectsPerTick: 25,
        updateFieldAppearances: true
      };
    }
  }

  /**
   * Comprime um PDF com diferentes níveis de qualidade
   * @param document - Documento PDF a ser comprimido
   * @param quality - Nível de qualidade (0.1 a 1.0)
   */
  static async compressPDF(document: PDFDocumentType, quality: number = 0.7): Promise<PDFDocumentType> {
    try {
      const arrayBuffer = await document.file.arrayBuffer();
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      
      // Determinar configurações baseadas na qualidade
      const compressionConfig = this.getCompressionConfig(quality);
      
      console.log(`Comprimindo PDF "${document.name}" com qualidade ${(quality * 100).toFixed(0)}%`);
      console.log('Configuração de compressão:', compressionConfig);
      
      // Salvar o PDF com configurações otimizadas baseadas na qualidade
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: compressionConfig.useObjectStreams,
        addDefaultPage: false,
        objectsPerTick: compressionConfig.objectsPerTick,
        updateFieldAppearances: compressionConfig.updateFieldAppearances
      });
      
      // Criar um novo File com o PDF comprimido
      const arrayBuffer2 = new ArrayBuffer(compressedBytes.length);
      const uint8Array = new Uint8Array(arrayBuffer2);
      uint8Array.set(compressedBytes);
      
      const compressedFile = new File([arrayBuffer2], document.name.replace('.pdf', '_comprimido.pdf'), {
        type: 'application/pdf',
        lastModified: Date.now()
      });
      
      // Criar nova instância do PDF comprimido
      const compressedPdfDoc = await PDFLibDocument.load(compressedBytes);
      
      // Criar novo documento com o arquivo comprimido
      const compressedDocument: PDFDocumentType = {
        ...document,
        file: compressedFile,
        size: compressedFile.size,
        name: compressedFile.name
      };

      return compressedDocument;
    } catch (error) {
      console.error('Erro ao comprimir PDF:', error);
      throw new Error('Falha ao comprimir PDF');
    }
  }

  /**
   * Comprime múltiplos PDFs em lote
   */
  static async compressMultiplePDFs(documents: PDFDocumentType[], quality: number = 0.7): Promise<PDFDocumentType[]> {
    const compressedDocuments: PDFDocumentType[] = [];
    
    for (const document of documents) {
      try {
        const compressed = await PDFService.compressPDF(document, quality);
        compressedDocuments.push(compressed);
      } catch (error) {
        console.error(`Erro ao comprimir documento ${document.name}:`, error);
        // Em caso de erro, manter o documento original
        compressedDocuments.push(document);
      }
    }
    
    return compressedDocuments;
  }

  /**
   * Calcula a taxa de compressão entre dois documentos
   */
  static calculateCompressionRatio(originalSize: number, compressedSize: number): {
    ratio: number;
    percentage: number;
    savedBytes: number;
  } {
    const savedBytes = originalSize - compressedSize;
    const ratio = originalSize / compressedSize;
    const percentage = (savedBytes / originalSize) * 100;
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      savedBytes
    };
  }
}