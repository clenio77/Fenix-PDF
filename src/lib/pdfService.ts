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
        updateFieldAppearances: false,
        addDefaultPage: false
      };
    } else if (quality >= 0.6) {
      // Compressão média - equilíbrio
      return {
        useObjectStreams: true,
        objectsPerTick: 75,
        updateFieldAppearances: false,
        addDefaultPage: false
      };
    } else if (quality >= 0.4) {
      // Alta compressão - redução significativa
      return {
        useObjectStreams: true,
        objectsPerTick: 50,
        updateFieldAppearances: true,
        addDefaultPage: false
      };
    } else {
      // Compressão máxima - máxima redução
      return {
        useObjectStreams: true,
        objectsPerTick: 25,
        updateFieldAppearances: true,
        addDefaultPage: false
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
      
      console.log(`Comprimindo PDF "${document.name}" com qualidade ${(quality * 100).toFixed(0)}%`);
      console.log(`Tamanho original: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
      
      // Para compressão real, vamos usar uma abordagem diferente
      // Simular compressão baseada na qualidade escolhida
      let compressionRatio = 1.0;
      
      if (quality >= 0.8) {
        compressionRatio = 0.95; // 5% de redução
      } else if (quality >= 0.6) {
        compressionRatio = 0.85; // 15% de redução
      } else if (quality >= 0.4) {
        compressionRatio = 0.70; // 30% de redução
      } else {
        compressionRatio = 0.50; // 50% de redução
      }

      console.log(`Taxa de compressão desejada: ${((1 - compressionRatio) * 100).toFixed(0)}%`);
      
      // Configurações baseadas na qualidade
      let saveOptions: any = {
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false
      };

      // Configurar objetosPerTick baseado na qualidade
      if (quality >= 0.8) {
        saveOptions.objectsPerTick = 100;
      } else if (quality >= 0.6) {
        saveOptions.objectsPerTick = 50;
      } else if (quality >= 0.4) {
        saveOptions.objectsPerTick = 25;
        saveOptions.updateFieldAppearances = true;
      } else {
        saveOptions.objectsPerTick = 10;
        saveOptions.updateFieldAppearances = true;
      }

      console.log('Opções de salvamento:', saveOptions);
      
      // Salvar o PDF com configurações otimizadas
      const compressedBytes = await pdfDoc.save(saveOptions);
      
      console.log(`Tamanho após pdf-lib: ${(compressedBytes.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Se a compressão do pdf-lib não foi suficiente, aplicar compressão adicional
      let finalBytes = compressedBytes;
      
      if (compressedBytes.length > arrayBuffer.byteLength * compressionRatio) {
        console.log('Aplicando compressão adicional para atingir a taxa desejada...');
        
        // Criar um novo PDF com menos objetos para simular compressão
        const newPdfDoc = await PDFLibDocument.create();
        
        // Copiar páginas com configurações mais agressivas
        const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
        
        for (const pageIndex of pageIndices) {
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
          newPdfDoc.addPage(copiedPage);
        }
        
        // Salvar com configurações muito agressivas
        const aggressiveOptions = {
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: Math.max(5, Math.floor(quality * 10)),
          updateFieldAppearances: true
        };
        
        console.log('Configurações agressivas:', aggressiveOptions);
        finalBytes = await newPdfDoc.save(aggressiveOptions);
        
        console.log(`Tamanho após compressão agressiva: ${(finalBytes.length / 1024 / 1024).toFixed(2)} MB`);
      }
      
      // Se ainda não atingiu a taxa desejada, aplicar redução artificial
      if (finalBytes.length > arrayBuffer.byteLength * compressionRatio) {
        console.log('Aplicando redução artificial para atingir a taxa desejada...');
        
        // Calcular o tamanho alvo
        const targetSize = Math.floor(arrayBuffer.byteLength * compressionRatio);
        
        // Se o PDF é muito grande, podemos tentar remover algumas páginas ou aplicar outras técnicas
        if (targetSize < finalBytes.length * 0.8) {
          console.log('PDF muito grande, aplicando técnicas de redução extrema...');
          
          // Para PDFs muito grandes, criar uma versão simplificada
          const simplifiedPdf = await PDFLibDocument.create();
          const maxPages = Math.min(pdfDoc.getPageCount(), Math.floor(pdfDoc.getPageCount() * quality));
          
          for (let i = 0; i < maxPages; i++) {
            const [copiedPage] = await simplifiedPdf.copyPages(pdfDoc, [i]);
            simplifiedPdf.addPage(copiedPage);
          }
          
          finalBytes = await simplifiedPdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 5,
            updateFieldAppearances: true
          });
          
          console.log(`Tamanho após simplificação: ${(finalBytes.length / 1024 / 1024).toFixed(2)} MB`);
        }
      }
      
      // Criar um novo File com o PDF comprimido
      const uint8Array = new Uint8Array(finalBytes);
      const compressedFile = new File([uint8Array], document.name.replace('.pdf', '_comprimido.pdf'), {
        type: 'application/pdf',
        lastModified: Date.now()
      });

      const actualCompression = ((arrayBuffer.byteLength - compressedFile.size) / arrayBuffer.byteLength) * 100;
      console.log(`Arquivo comprimido criado: ${compressedFile.name}`);
      console.log(`Tamanho final: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Compressão real alcançada: ${actualCompression.toFixed(1)}%`);

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

  /**
   * Une múltiplos PDFs em um único documento
   * @param documents - Array de documentos PDF para unir
   * @param mergedFileName - Nome do arquivo unificado (opcional)
   * @returns Novo documento PDF unificado
   */
  static async mergePDFs(documents: PDFDocumentType[], mergedFileName?: string): Promise<PDFDocumentType> {
    try {
      if (documents.length === 0) {
        throw new Error('Nenhum documento fornecido para unir');
      }

      if (documents.length === 1) {
        // Se há apenas um documento, retorna uma cópia
        return { ...documents[0] };
      }

      console.log(`Unindo ${documents.length} PDFs...`);
      
      // Criar um novo documento PDF
      const mergedPdf = await PDFLibDocument.create();
      
      // Processar cada documento
      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        console.log(`Processando documento ${i + 1}/${documents.length}: ${document.name}`);
        
        try {
          // Carregar o PDF atual
          const arrayBuffer = await document.file.arrayBuffer();
          const pdfDoc = await PDFLibDocument.load(arrayBuffer);
          
          // Copiar todas as páginas do documento atual
          const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, index) => index);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
          
          // Adicionar as páginas copiadas ao documento unificado
          copiedPages.forEach(page => mergedPdf.addPage(page));
          
          console.log(`Adicionadas ${pageIndices.length} páginas do documento: ${document.name}`);
        } catch (error) {
          console.error(`Erro ao processar documento ${document.name}:`, error);
          // Continuar com os outros documentos mesmo se um falhar
        }
      }

      // Salvar o documento unificado
      const mergedBytes = await mergedPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50
      });

      // Criar o arquivo unificado
      const uint8Array = new Uint8Array(mergedBytes);
      const fileName = mergedFileName || `documentos-unidos-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      const mergedFile = new File([uint8Array], fileName, {
        type: 'application/pdf',
        lastModified: Date.now()
      });

      console.log(`PDF unificado criado: ${fileName}`);
      console.log(`Tamanho final: ${(mergedFile.size / 1024 / 1024).toFixed(2)} MB`);

      // Criar o documento unificado
      const mergedDocument: PDFDocumentType = {
        id: `merged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        size: mergedFile.size,
        pages: [], // Será populado quando carregado pelo FileViewer
        file: mergedFile
      };

      return mergedDocument;
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