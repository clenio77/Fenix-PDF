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
   * Converte cor hex (#RRGGBB) para rgb do pdf-lib.
   */
  private static hexToRgb(hex: string = '#000000') {
    const cleaned = hex.replace('#', '').trim();
    const full =
      cleaned.length === 3
        ? cleaned
            .split('')
            .map((c) => c + c)
            .join('')
        : cleaned.padStart(6, '0').slice(0, 6);
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return rgb(0, 0, 0);
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }

  /**
   * Índice da página no arquivo original (preserva sourceIndex após reordenação).
   */
  private static resolveSourceIndex(page: PDFPage, fallback: number): number {
    if (typeof page.sourceIndex === 'number' && page.sourceIndex >= 0) {
      return page.sourceIndex;
    }
    return fallback;
  }

  /**
   * Rotaciona uma página do documento (metadados; aplicado no export).
   */
  static rotatePage(document: PDFDocumentType, pageIndex: number, rotation: number): PDFDocumentType {
    const updatedDocument = { ...document };
    
    if (pageIndex >= 0 && pageIndex < updatedDocument.pages.length) {
      const updatedPages = [...updatedDocument.pages];
      const page = { ...updatedPages[pageIndex] };
      
      page.rotation = ((page.rotation + rotation) % 360 + 360) % 360;
      
      updatedPages[pageIndex] = page;
      updatedDocument.pages = updatedPages;
    }
    
    return updatedDocument;
  }

  /**
   * Remove uma página da lista de exportação (preserva sourceIndex das demais).
   */
  static removePage(document: PDFDocumentType, pageIndex: number): PDFDocumentType {
    const updatedDocument = { ...document };
    
    if (pageIndex >= 0 && pageIndex < updatedDocument.pages.length) {
      if (updatedDocument.pages.length <= 1) {
        throw new Error('Não é possível remover a última página do documento');
      }
      const updatedPages = [...updatedDocument.pages];
      updatedPages.splice(pageIndex, 1);
      
      updatedDocument.pages = updatedPages.map((page, index) => ({
        ...page,
        index,
        sourceIndex: this.resolveSourceIndex(page, page.index),
      }));
    }
    
    return updatedDocument;
  }

  /**
   * Reordena as páginas do documento (preserva sourceIndex).
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
      
      updatedDocument.pages = updatedPages.map((page, index) => ({
        ...page,
        index,
        sourceIndex: this.resolveSourceIndex(page, page.index),
      }));
    }
    
    return updatedDocument;
  }

  /**
   * Move uma página de um documento para outro (preserva sourceIndex / file de origem).
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

    if (sourceDocument.pages.length <= 1) {
      return { sourceDocument, targetDocument };
    }

    const sourcePages = [...sourceDocument.pages];
    const targetPages = [...targetDocument.pages];
    
    const [movedPage] = sourcePages.splice(sourcePageIndex, 1);
    // Página movida ainda aponta para o File do documento de origem —
    // cross-doc move só é seguro no export se ambos forem do mesmo file.
    // Por simplicidade, mantemos a página no target com sourceIndex; o export
    // de documentos separados usa o file de cada documento.
    targetPages.splice(targetPageIndex, 0, {
      ...movedPage,
      sourceIndex: this.resolveSourceIndex(movedPage, movedPage.index),
    });
    
    const updatedSourcePages = sourcePages.map((page, index) => ({
      ...page,
      index,
      sourceIndex: this.resolveSourceIndex(page, page.index),
    }));
    const updatedTargetPages = targetPages.map((page, index) => ({
      ...page,
      index,
      sourceIndex: this.resolveSourceIndex(page, page.index),
    }));
    
    return {
      sourceDocument: { ...sourceDocument, pages: updatedSourcePages },
      targetDocument: { ...targetDocument, pages: updatedTargetPages }
    };
  }

  /**
   * Desenha anotações de texto numa página pdf-lib.
   * Coordenadas das anotações são top-left (CSS/react-pdf) em escala 1.
   */
  private static drawAnnotationsOnPage(
    pdfPage: ReturnType<PDFLibDocument['getPage']>,
    pageMeta: PDFPage
  ) {
    const { width, height } = pdfPage.getSize();
    const metaW = pageMeta.width || width;
    const metaH = pageMeta.height || height;
    const scaleX = width / metaW;
    const scaleY = height / metaH;

    for (const ann of pageMeta.textAnnotations || []) {
      if (!ann.content?.trim()) continue;
      const fontSize = ann.fontSize || 12;
      const x = Math.max(0, ann.x * scaleX);
      const y = Math.max(0, height - ann.y * scaleY - fontSize);

      try {
        pdfPage.drawText(ann.content, {
          x,
          y,
          size: fontSize,
          color: this.hexToRgb(ann.color),
          maxWidth: (ann.width || 200) * scaleX,
          lineHeight: fontSize * 1.2,
        });
      } catch (err) {
        console.warn('Falha ao desenhar anotação no PDF:', err);
      }
    }
  }

  /**
   * Gera um novo arquivo PDF honrando ordem, exclusões, rotação e anotações.
   */
  static async generatePDF(documents: PDFDocumentType[]): Promise<Blob> {
    try {
      const pdfDoc = await PDFLibDocument.create();
      
      for (const document of documents) {
        const arrayBuffer = await document.file.arrayBuffer();
        const sourcePdfDoc = await PDFLibDocument.load(arrayBuffer);
        const filePageCount = sourcePdfDoc.getPageCount();

        const pagesToExport: PDFPage[] =
          document.pages.length > 0
            ? document.pages
            : Array.from({ length: filePageCount }, (_, i) => ({
                id: `page-${document.id}-${i}`,
                index: i,
                sourceIndex: i,
                rotation: 0,
                textAnnotations: [],
                width: 0,
                height: 0,
              }));

        for (const pageMeta of pagesToExport) {
          const sourceIdx = this.resolveSourceIndex(pageMeta, pageMeta.index);
          if (sourceIdx < 0 || sourceIdx >= filePageCount) continue;

          const [copiedPage] = await pdfDoc.copyPages(sourcePdfDoc, [sourceIdx]);
          pdfDoc.addPage(copiedPage);

          const pdfPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);

          if (pageMeta.rotation && pageMeta.rotation % 360 !== 0) {
            pdfPage.setRotation(degrees(pageMeta.rotation));
          }

          this.drawAnnotationsOnPage(pdfPage, pageMeta);
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
      return {
        useObjectStreams: true,
        objectsPerTick: 100,
        updateFieldAppearances: false,
        addDefaultPage: false
      };
    } else if (quality >= 0.6) {
      return {
        useObjectStreams: true,
        objectsPerTick: 50,
        updateFieldAppearances: false,
        addDefaultPage: false
      };
    } else if (quality >= 0.4) {
      return {
        useObjectStreams: true,
        objectsPerTick: 25,
        updateFieldAppearances: true,
        addDefaultPage: false
      };
    } else {
      return {
        useObjectStreams: true,
        objectsPerTick: 10,
        updateFieldAppearances: true,
        addDefaultPage: false
      };
    }
  }

  /**
   * Comprime um PDF preservando TODAS as páginas.
   * Usa reescrita estrutural via pdf-lib (object streams). A redução costuma
   * ser modesta; nunca remove páginas para atingir uma taxa artificial.
   */
  static async compressPDF(document: PDFDocumentType, quality: number = 0.7): Promise<PDFDocumentType> {
    try {
      const arrayBuffer = await document.file.arrayBuffer();
      const sourcePdf = await PDFLibDocument.load(arrayBuffer);
      const pageCount = sourcePdf.getPageCount();

      const compressedPdf = await PDFLibDocument.create();
      const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
      const copiedPages = await compressedPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => compressedPdf.addPage(page));

      const saveOptions = this.getCompressionConfig(quality);
      const compressedBytes = await compressedPdf.save(saveOptions);

      const uint8Array = new Uint8Array(compressedBytes);
      const compressedFile = new File(
        [uint8Array],
        document.name.replace(/\.pdf$/i, '_comprimido.pdf'),
        {
          type: 'application/pdf',
          lastModified: Date.now(),
        }
      );

      // Preservar metadados de páginas (sourceIndex, rotação, anotações)
      const preservedPages =
        document.pages.length > 0
          ? document.pages.map((page, index) => ({
              ...page,
              index,
              sourceIndex: this.resolveSourceIndex(page, index),
            }))
          : Array.from({ length: pageCount }, (_, i) => ({
              id: `page-${document.id}-${i}`,
              index: i,
              sourceIndex: i,
              rotation: 0,
              textAnnotations: [],
              width: 0,
              height: 0,
            }));

      return {
        ...document,
        file: compressedFile,
        size: compressedFile.size,
        name: compressedFile.name,
        pages: preservedPages,
      };
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

  /**
   * Une múltiplos PDFs em um único documento (honra ordem/rotação/anotações).
   */
  static async mergePDFs(documents: PDFDocumentType[], mergedFileName?: string): Promise<PDFDocumentType> {
    try {
      if (documents.length === 0) {
        throw new Error('Nenhum documento fornecido para unir');
      }

      if (documents.length === 1) {
        return { ...documents[0] };
      }

      const blob = await this.generatePDF(documents);
      const fileName =
        mergedFileName ||
        `documentos-unidos-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      const mergedFile = new File([blob], fileName, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });

      return {
        id: `merged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        size: mergedFile.size,
        pages: [],
        file: mergedFile,
      };
    } catch (error) {
      console.error('Erro ao unir PDFs:', error);
      throw new Error(`Falha ao unir PDFs: ${(error as Error).message}`);
    }
  }

  /**
   * Comprime e une múltiplos PDFs em um único documento otimizado
   * @param documents - Array de documentos PDF para comprimir e unir
   * @param quality - Nível de qualidade da compressão (0.1 a 1.0)
   * @param mergedFileName - Nome do arquivo unificado (opcional)
   * @returns Novo documento PDF comprimido e unificado
   */
  static async compressAndMergePDFs(
    documents: PDFDocumentType[], 
    quality: number = 0.7,
    mergedFileName?: string
  ): Promise<PDFDocumentType> {
    try {
      if (documents.length === 0) {
        throw new Error('Nenhum documento fornecido para comprimir e unir');
      }

      console.log(`Comprimindo e unindo ${documents.length} PDFs com qualidade ${(quality * 100).toFixed(0)}%...`);
      
      // Primeiro, comprimir todos os documentos
      const compressedDocuments: PDFDocumentType[] = [];
      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        console.log(`Comprimindo documento ${i + 1}/${documents.length}: ${document.name}`);
        
        const compressedDoc = await this.compressPDF(document, quality);
        compressedDocuments.push(compressedDoc);
      }

      // Depois, unir os documentos comprimidos
      const mergedDocument = await this.mergePDFs(compressedDocuments, mergedFileName);
      
      console.log('Compressão e união concluídas com sucesso!');
      return mergedDocument;
    } catch (error) {
      console.error('Erro ao comprimir e unir PDFs:', error);
      throw new Error(`Falha ao comprimir e unir PDFs: ${(error as Error).message}`);
    }
  }
}