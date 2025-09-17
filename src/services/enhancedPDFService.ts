/**
 * EnhancedPDFService - Serviço aprimorado para edição real de PDFs
 * 
 * Este serviço expande o PDFService original com capacidades avançadas:
 * - Detecção inteligente de texto
 * - Edição real preservando formatação
 * - Análise de estrutura de documento
 * - Validação de áreas de cobertura
 */

import { PDFDocument as PDFLibDocument, rgb, StandardFonts } from 'pdf-lib';
import { PDFDocument as PDFDocumentType } from '../lib/types';
import { PDFTextAnalyzer, TextItem, TextSearchResult } from './PDFTextAnalyzer';
import { NotificationService } from '../lib/notifications';

export interface EditTextOptions {
  preserveFormatting?: boolean;
  autoDetectFont?: boolean;
  validateCoverage?: boolean;
  showRecommendations?: boolean;
}

export interface TextEditResult {
  success: boolean;
  message: string;
  recommendations?: string[];
  modifiedDocument: PDFDocumentType;
}

export class EnhancedPDFService {
  /**
   * Edita texto do PDF com detecção inteligente
   */
  static async editTextWithDetection(
    document: PDFDocumentType,
    pageIndex: number,
    searchText: string,
    newText: string,
    options: EditTextOptions = {}
  ): Promise<TextEditResult> {
    if (!document.pdfDoc) {
      return {
        success: false,
        message: 'PDF não carregado corretamente',
        modifiedDocument: document
      };
    }

    try {
      const {
        preserveFormatting = true,
        autoDetectFont = true,
        validateCoverage = true,
        showRecommendations = true
      } = options;

      // Buscar o texto no PDF
      const searchResult = await PDFTextAnalyzer.getTextBoundingBox(
        document.pdfDoc,
        pageIndex,
        searchText
      );

      if (!searchResult.found) {
        return {
          success: false,
          message: `Texto "${searchText}" não encontrado na página ${pageIndex + 1}`,
          modifiedDocument: document
        };
      }

      // Analisar a estrutura da página para obter informações de formatação
      const pageStructure = await PDFTextAnalyzer.analyzePageTextStructure(
        document.pdfDoc,
        pageIndex
      );

      // Calcular área de cobertura otimizada
      const coverageArea = PDFTextAnalyzer.calculateOptimalCoverageArea(
        newText,
        pageStructure.averageFontSize,
        pageStructure.fontFamilies[0] || 'Arial'
      );

      // Validar área de cobertura se solicitado
      let recommendations: string[] = [];
      if (validateCoverage && showRecommendations) {
        const validation = PDFTextAnalyzer.validateCoverageArea(
          newText,
          pageStructure.averageFontSize,
          coverageArea.width,
          coverageArea.height
        );
        
        if (!validation.valid) {
          recommendations = validation.recommendations;
        }
      }

      // Criar nova instância do PDF para edição
      const originalBytes = await document.pdfDoc.save();
      const pdfDoc = await PDFLibDocument.load(originalBytes);
      const page = pdfDoc.getPage(pageIndex);

      // Aplicar cobertura do texto antigo
      if (searchResult.boundingBox) {
        await this.applyTextCoverage(page, searchResult.boundingBox);
      }

      // Adicionar novo texto preservando formatação
      await this.addTextWithFormatting(
        page,
        searchResult.boundingBox || { x: 50, y: page.getSize().height - 100, width: 200, height: 20 },
        newText,
        pageStructure,
        autoDetectFont
      );

      // Criar novo documento com as modificações
      const modifiedBytes = await pdfDoc.save();
      const modifiedPdfDoc = await PDFLibDocument.load(modifiedBytes);

      // Criar novo File com o PDF modificado
      const arrayBuffer = new ArrayBuffer(modifiedBytes.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      uint8Array.set(modifiedBytes);

      const modifiedFile = new File([arrayBuffer], document.name, {
        type: 'application/pdf',
        lastModified: Date.now()
      });

      const modifiedDocument: PDFDocumentType = {
        ...document,
        file: modifiedFile,
        pdfDoc: modifiedPdfDoc,
        pages: document.pages.map((page, index) => ({
          ...page,
          width: index === pageIndex ? pdfDoc.getPage(index).getSize().width : page.width,
          height: index === pageIndex ? pdfDoc.getPage(index).getSize().height : page.height,
        }))
      };

      return {
        success: true,
        message: `Texto editado com sucesso! ${searchResult.totalMatches} ocorrência(s) encontrada(s).`,
        recommendations,
        modifiedDocument
      };

    } catch (error) {
      console.error('Erro ao editar texto com detecção:', error);
      return {
        success: false,
        message: `Erro ao editar texto: ${(error as Error).message}`,
        modifiedDocument: document
      };
    }
  }

  /**
   * Edita texto por coordenadas com análise inteligente
   */
  static async editTextAtCoordinatesWithAnalysis(
    document: PDFDocumentType,
    pageIndex: number,
    pdfX: number,
    pdfY: number,
    newText: string,
    options: EditTextOptions = {}
  ): Promise<TextEditResult> {
    if (!document.pdfDoc) {
      return {
        success: false,
        message: 'PDF não carregado corretamente',
        modifiedDocument: document
      };
    }

    try {
      const { autoDetectFont = true, validateCoverage = true } = options;

      // Tentar encontrar texto na posição especificada
      const textAtPosition = await PDFTextAnalyzer.findTextAtPosition(
        document.pdfDoc,
        pageIndex,
        pdfX,
        pdfY,
        15 // tolerância de 15 pixels
      );

      // Analisar estrutura da página
      const pageStructure = await PDFTextAnalyzer.analyzePageTextStructure(
        document.pdfDoc,
        pageIndex
      );

      // Determinar parâmetros de formatação
      let fontSize = pageStructure.averageFontSize;
      let fontFamily = pageStructure.fontFamilies[0] || 'Arial';

      if (textAtPosition && autoDetectFont) {
        fontSize = textAtPosition.fontSize;
        fontFamily = textAtPosition.fontFamily;
      }

      // Calcular área de cobertura
      const coverageArea = PDFTextAnalyzer.calculateOptimalCoverageArea(
        newText,
        fontSize,
        fontFamily
      );

      // Validar área se solicitado
      let recommendations: string[] = [];
      if (validateCoverage) {
        const validation = PDFTextAnalyzer.validateCoverageArea(
          newText,
          fontSize,
          coverageArea.width,
          coverageArea.height
        );
        
        if (!validation.valid) {
          recommendations = validation.recommendations;
        }
      }

      // Aplicar edição
      const originalBytes = await document.pdfDoc.save();
      const pdfDoc = await PDFLibDocument.load(originalBytes);
      const page = pdfDoc.getPage(pageIndex);

      // Aplicar cobertura se houver texto na posição
      if (textAtPosition) {
        await this.applyTextCoverage(page, textAtPosition.boundingBox);
      } else {
        // Aplicar cobertura baseada na área calculada
        await this.applyTextCoverage(page, {
          x: pdfX - 2,
          y: pdfY - coverageArea.height - 2,
          width: coverageArea.width + 4,
          height: coverageArea.height + 4
        });
      }

      // Adicionar novo texto
      await this.addTextWithFormatting(
        page,
        { x: pdfX, y: pdfY, width: coverageArea.width, height: coverageArea.height },
        newText,
        pageStructure,
        autoDetectFont
      );

      // Criar documento modificado
      const modifiedBytes = await pdfDoc.save();
      const modifiedPdfDoc = await PDFLibDocument.load(modifiedBytes);

      const arrayBuffer = new ArrayBuffer(modifiedBytes.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      uint8Array.set(modifiedBytes);

      const modifiedFile = new File([arrayBuffer], document.name, {
        type: 'application/pdf',
        lastModified: Date.now()
      });

      const modifiedDocument: PDFDocumentType = {
        ...document,
        file: modifiedFile,
        pdfDoc: modifiedPdfDoc,
        pages: document.pages.map((page, index) => ({
          ...page,
          width: index === pageIndex ? pdfDoc.getPage(index).getSize().width : page.width,
          height: index === pageIndex ? pdfDoc.getPage(index).getSize().height : page.height,
        }))
      };

      const message = textAtPosition 
        ? `Texto editado com sucesso! Texto original detectado: "${textAtPosition.content}"`
        : 'Texto adicionado com sucesso!';

      return {
        success: true,
        message,
        recommendations,
        modifiedDocument
      };

    } catch (error) {
      console.error('Erro ao editar texto por coordenadas:', error);
      return {
        success: false,
        message: `Erro ao editar texto: ${(error as Error).message}`,
        modifiedDocument: document
      };
    }
  }

  /**
   * Analisa um documento PDF e retorna informações sobre sua estrutura
   */
  static async analyzeDocument(document: PDFDocumentType): Promise<{
    hasSelectableText: boolean;
    pageAnalysis: Array<{
      pageIndex: number;
      totalTextItems: number;
      averageFontSize: number;
      fontFamilies: string[];
      textDensity: number;
      hasMultipleColumns: boolean;
      estimatedLineHeight: number;
    }>;
    recommendations: string[];
  }> {
    if (!document.pdfDoc) {
      return {
        hasSelectableText: false,
        pageAnalysis: [],
        recommendations: ['PDF não carregado corretamente']
      };
    }

    const hasSelectableText = await PDFTextAnalyzer.hasSelectableText(document.pdfDoc);
    const pageAnalysis = [];
    const recommendations = [];

    for (let i = 0; i < document.pdfDoc.getPageCount(); i++) {
      const analysis = await PDFTextAnalyzer.analyzePageTextStructure(document.pdfDoc, i);
      pageAnalysis.push({
        pageIndex: i,
        ...analysis
      });

      // Gerar recomendações baseadas na análise
      if (analysis.totalTextItems === 0) {
        recommendations.push(`Página ${i + 1}: Nenhum texto selecionável detectado. Pode ser uma imagem escaneada.`);
      } else if (analysis.textDensity < 0.001) {
        recommendations.push(`Página ${i + 1}: Baixa densidade de texto. Considere usar OCR se necessário.`);
      }
    }

    return {
      hasSelectableText,
      pageAnalysis,
      recommendations
    };
  }

  /**
   * Aplica cobertura de texto (retângulos brancos para "apagar" texto)
   */
  private static async applyTextCoverage(
    page: any,
    boundingBox: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    // Múltiplas camadas para garantir cobertura completa
    const layers = [
      { x: boundingBox.x - 2, y: boundingBox.y - 2, width: boundingBox.width + 4, height: boundingBox.height + 4 },
      { x: boundingBox.x - 1, y: boundingBox.y - 1, width: boundingBox.width + 2, height: boundingBox.height + 2 },
      { x: boundingBox.x, y: boundingBox.y, width: boundingBox.width, height: boundingBox.height }
    ];

    for (const layer of layers) {
      page.drawRectangle({
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        color: rgb(1, 1, 1), // Branco
        borderColor: rgb(1, 1, 1),
        borderWidth: 0
      });
    }
  }

  /**
   * Adiciona texto preservando formatação
   */
  private static async addTextWithFormatting(
    page: any,
    position: { x: number; y: number; width: number; height: number },
    text: string,
    pageStructure: any,
    autoDetectFont: boolean
  ): Promise<void> {
    let fontSize = 12;
    let fontFamily = 'Arial';

    if (autoDetectFont) {
      fontSize = pageStructure.averageFontSize;
      fontFamily = pageStructure.fontFamilies[0] || 'Arial';
    }

    // Carregar fonte apropriada
    let font;
    try {
      if (fontFamily.toLowerCase().includes('times') || fontFamily.toLowerCase().includes('serif')) {
        font = await page.doc.embedFont(StandardFonts.TimesRoman);
      } else if (fontFamily.toLowerCase().includes('courier') || fontFamily.toLowerCase().includes('mono')) {
        font = await page.doc.embedFont(StandardFonts.Courier);
      } else {
        font = await page.doc.embedFont(StandardFonts.Helvetica);
      }
    } catch (error) {
      console.warn('Erro ao carregar fonte, usando padrão:', error);
      font = await page.doc.embedFont(StandardFonts.Helvetica);
    }

    // Adicionar texto
    page.drawText(text, {
      x: position.x,
      y: position.y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0) // Preto
    });
  }

  /**
   * Valida se um documento é adequado para edição
   */
  static async validateDocumentForEditing(document: PDFDocumentType): Promise<{
    canEdit: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!document.pdfDoc) {
      issues.push('PDF não carregado corretamente');
      return { canEdit: false, issues, recommendations };
    }

    // Verificar se tem texto selecionável
    const hasSelectableText = await PDFTextAnalyzer.hasSelectableText(document.pdfDoc);
    
    if (!hasSelectableText) {
      issues.push('PDF não contém texto selecionável');
      recommendations.push('Este PDF pode ser uma imagem escaneada. Considere usar OCR.');
    }

    // Verificar tamanho do arquivo
    if (document.size > 50 * 1024 * 1024) { // 50MB
      issues.push('PDF muito grande (>50MB)');
      recommendations.push('Considere dividir o PDF em partes menores para melhor performance.');
    }

    // Verificar número de páginas
    if (document.pdfDoc.getPageCount() > 100) {
      issues.push('PDF com muitas páginas (>100)');
      recommendations.push('Considere processar páginas em lotes menores.');
    }

    const canEdit = issues.length === 0;

    return {
      canEdit,
      issues,
      recommendations
    };
  }
}
