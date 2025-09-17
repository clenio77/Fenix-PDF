/**
 * PDFTextAnalyzer - Serviço para análise e detecção inteligente de texto em PDFs
 * 
 * Este serviço expande as capacidades de edição real do PDF, permitindo:
 * - Extração de texto selecionável
 * - Detecção de posições e bounding boxes
 * - Análise de formatação e estilos
 * - Mapeamento de texto para coordenadas
 */

import { PDFDocument as PDFLibDocument, PDFPage as PDFLibPage } from 'pdf-lib';
import { PDFDocument as PDFDocumentType } from '../lib/types';

export interface TextItem {
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  pageIndex: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TextSearchResult {
  found: boolean;
  textItems: TextItem[];
  totalMatches: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class PDFTextAnalyzer {
  /**
   * Extrai todo o texto selecionável de uma página específica
   */
  static async extractSelectableText(
    pdfDoc: PDFLibDocument, 
    pageIndex: number
  ): Promise<TextItem[]> {
    try {
      const page = pdfDoc.getPage(pageIndex);
      const { width, height } = page.getSize();
      
      // Nota: pdf-lib não tem getTextContent nativo
      // Esta é uma implementação baseada em análise de operadores
      const textItems: TextItem[] = [];
      
      // Para PDFs com texto selecionável, vamos usar uma abordagem alternativa
      // que analisa as operações de desenho de texto na página
      const operators = await this.extractTextOperators(page);
      
      for (const operator of operators) {
        if (operator.type === 'text') {
          textItems.push({
            content: operator.text,
            x: operator.x,
            y: operator.y,
            width: this.estimateTextWidth(operator.text, operator.fontSize),
            height: operator.fontSize * 1.2,
            fontSize: operator.fontSize,
            fontFamily: operator.fontFamily || 'Arial',
            color: operator.color || '#000000',
            pageIndex,
            boundingBox: {
              x: operator.x,
              y: operator.y - operator.fontSize,
              width: this.estimateTextWidth(operator.text, operator.fontSize),
              height: operator.fontSize * 1.2
            }
          });
        }
      }
      
      return textItems;
    } catch (error) {
      console.error('Erro ao extrair texto selecionável:', error);
      return [];
    }
  }

  /**
   * Encontra texto em uma posição específica
   */
  static async findTextAtPosition(
    pdfDoc: PDFLibDocument,
    pageIndex: number,
    x: number,
    y: number,
    tolerance: number = 10
  ): Promise<TextItem | null> {
    const textItems = await this.extractSelectableText(pdfDoc, pageIndex);
    
    for (const item of textItems) {
      if (
        x >= item.boundingBox.x - tolerance &&
        x <= item.boundingBox.x + item.boundingBox.width + tolerance &&
        y >= item.boundingBox.y - tolerance &&
        y <= item.boundingBox.y + item.boundingBox.height + tolerance
      ) {
        return item;
      }
    }
    
    return null;
  }

  /**
   * Obtém o bounding box de um texto específico
   */
  static async getTextBoundingBox(
    pdfDoc: PDFLibDocument,
    pageIndex: number,
    searchText: string
  ): Promise<TextSearchResult> {
    const textItems = await this.extractSelectableText(pdfDoc, pageIndex);
    const matches = textItems.filter(item => 
      item.content.toLowerCase().includes(searchText.toLowerCase())
    );

    if (matches.length === 0) {
      return {
        found: false,
        textItems: [],
        totalMatches: 0
      };
    }

    // Calcular bounding box que engloba todas as ocorrências
    const minX = Math.min(...matches.map(m => m.boundingBox.x));
    const minY = Math.min(...matches.map(m => m.boundingBox.y));
    const maxX = Math.max(...matches.map(m => m.boundingBox.x + m.boundingBox.width));
    const maxY = Math.max(...matches.map(m => m.boundingBox.y + m.boundingBox.height));

    return {
      found: true,
      textItems: matches,
      totalMatches: matches.length,
      boundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      }
    };
  }

  /**
   * Detecta se o PDF contém texto selecionável
   */
  static async hasSelectableText(pdfDoc: PDFLibDocument): Promise<boolean> {
    try {
      const pageCount = pdfDoc.getPageCount();
      for (let i = 0; i < pageCount; i++) {
        const textItems = await this.extractSelectableText(pdfDoc, i);
        if (textItems.length > 0) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao detectar texto selecionável:', error);
      return false;
    }
  }

  /**
   * Analisa a estrutura de texto de uma página
   */
  static async analyzePageTextStructure(
    pdfDoc: PDFLibDocument,
    pageIndex: number
  ): Promise<{
    totalTextItems: number;
    averageFontSize: number;
    fontFamilies: string[];
    textDensity: number;
    hasMultipleColumns: boolean;
    estimatedLineHeight: number;
  }> {
    const textItems = await this.extractSelectableText(pdfDoc, pageIndex);
    const page = pdfDoc.getPage(pageIndex);
    const { width, height } = page.getSize();
    
    if (textItems.length === 0) {
      return {
        totalTextItems: 0,
        averageFontSize: 12,
        fontFamilies: [],
        textDensity: 0,
        hasMultipleColumns: false,
        estimatedLineHeight: 14
      };
    }

    const averageFontSize = textItems.reduce((sum, item) => sum + item.fontSize, 0) / textItems.length;
    const fontFamilies = Array.from(new Set(textItems.map(item => item.fontFamily)));
    const textDensity = textItems.length / (width * height);
    
    // Detectar múltiplas colunas analisando distribuição de X
    const xPositions = textItems.map(item => item.x).sort((a, b) => a - b);
    const hasMultipleColumns = this.detectMultipleColumns(xPositions);
    
    // Estimar altura da linha baseada na distribuição de Y
    const yPositions = textItems.map(item => item.y).sort((a, b) => b - a);
    const estimatedLineHeight = this.estimateLineHeight(yPositions);

    return {
      totalTextItems: textItems.length,
      averageFontSize,
      fontFamilies,
      textDensity,
      hasMultipleColumns,
      estimatedLineHeight
    };
  }

  /**
   * Extrai operadores de texto de uma página (implementação simplificada)
   * Nota: pdf-lib não expõe operadores diretamente, então esta é uma aproximação
   */
  private static async extractTextOperators(page: PDFLibPage): Promise<Array<{
    type: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
    color?: string;
  }>> {
    // Esta é uma implementação simplificada
    // Em uma implementação real, seria necessário usar bibliotecas como pdf2pic
    // ou analisar o conteúdo bruto do PDF
    
    const operators: Array<{
      type: string;
      text: string;
      x: number;
      y: number;
      fontSize: number;
      fontFamily?: string;
      color?: string;
    }> = [];

    // Por enquanto, retornamos um array vazio
    // Esta funcionalidade seria implementada com uma biblioteca mais avançada
    // como pdfjs-dist ou pdf2pic
    
    return operators;
  }

  /**
   * Estima a largura de um texto baseado no tamanho da fonte
   */
  private static estimateTextWidth(text: string, fontSize: number): number {
    // Aproximação baseada em caracteres médios
    const averageCharWidth = fontSize * 0.6;
    return text.length * averageCharWidth;
  }

  /**
   * Detecta se há múltiplas colunas no layout
   */
  private static detectMultipleColumns(xPositions: number[]): boolean {
    if (xPositions.length < 10) return false;
    
    // Agrupar posições X em clusters
    const clusters: number[][] = [];
    let currentCluster = [xPositions[0]];
    
    for (let i = 1; i < xPositions.length; i++) {
      const diff = xPositions[i] - xPositions[i - 1];
      if (diff < 50) { // Threshold para considerar como mesma coluna
        currentCluster.push(xPositions[i]);
      } else {
        clusters.push(currentCluster);
        currentCluster = [xPositions[i]];
      }
    }
    clusters.push(currentCluster);
    
    return clusters.length > 1;
  }

  /**
   * Estima a altura da linha baseada na distribuição de posições Y
   */
  private static estimateLineHeight(yPositions: number[]): number {
    if (yPositions.length < 2) return 14;
    
    const diffs: number[] = [];
    for (let i = 0; i < yPositions.length - 1; i++) {
      const diff = yPositions[i] - yPositions[i + 1];
      if (diff > 5 && diff < 50) { // Filtrar diferenças muito pequenas ou grandes
        diffs.push(diff);
      }
    }
    
    if (diffs.length === 0) return 14;
    
    // Retornar a mediana das diferenças
    diffs.sort((a, b) => a - b);
    const medianIndex = Math.floor(diffs.length / 2);
    return diffs[medianIndex];
  }

  /**
   * Calcula área de cobertura otimizada para um texto
   */
  static calculateOptimalCoverageArea(
    text: string,
    fontSize: number,
    fontFamily: string = 'Arial'
  ): { width: number; height: number } {
    // Estimar largura baseada no texto
    const estimatedWidth = Math.max(50, text.length * fontSize * 0.6);
    
    // Estimar altura baseada no tamanho da fonte
    const estimatedHeight = Math.max(12, fontSize * 1.2);
    
    // Adicionar margem de segurança
    return {
      width: estimatedWidth + 10,
      height: estimatedHeight + 4
    };
  }

  /**
   * Valida se uma área de cobertura é adequada para um texto
   */
  static validateCoverageArea(
    text: string,
    fontSize: number,
    coverageWidth: number,
    coverageHeight: number
  ): { valid: boolean; recommendations: string[] } {
    const recommendations: string[] = [];
    const optimal = this.calculateOptimalCoverageArea(text, fontSize);
    
    if (coverageWidth < optimal.width * 0.8) {
      recommendations.push(`Largura muito pequena. Recomendado: ${optimal.width}px`);
    }
    
    if (coverageHeight < optimal.height * 0.8) {
      recommendations.push(`Altura muito pequena. Recomendado: ${optimal.height}px`);
    }
    
    if (coverageWidth > optimal.width * 2) {
      recommendations.push(`Largura muito grande. Pode cobrir texto adjacente.`);
    }
    
    if (coverageHeight > optimal.height * 2) {
      recommendations.push(`Altura muito grande. Pode cobrir texto adjacente.`);
    }
    
    return {
      valid: recommendations.length === 0,
      recommendations
    };
  }
}
