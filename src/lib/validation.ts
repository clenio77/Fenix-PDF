export class ValidationService {
  // Tamanho máximo de arquivo (50MB)
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024;
  
  // Tipos MIME válidos para PDF
  private static readonly VALID_MIME_TYPES = [
    'application/pdf',
    'application/x-pdf',
    'application/acrobat',
    'text/pdf',
    'text/x-pdf'
  ];

  /**
   * Valida se um arquivo é um PDF válido
   */
  static validatePDF(file: File): { isValid: boolean; error?: string } {
    // Verificar se o arquivo existe
    if (!file) {
      return { isValid: false, error: 'Nenhum arquivo fornecido' };
    }

    // Verificar tamanho do arquivo
    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `Arquivo muito grande. Tamanho máximo permitido: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB` 
      };
    }

    // Verificar se o arquivo está vazio
    if (file.size === 0) {
      return { isValid: false, error: 'Arquivo vazio' };
    }

    // Verificar tipo MIME
    if (!this.VALID_MIME_TYPES.includes(file.type)) {
      return { isValid: false, error: 'Tipo de arquivo inválido. Apenas PDFs são aceitos' };
    }

    // Verificar extensão do arquivo
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return { isValid: false, error: 'Extensão de arquivo inválida. Use .pdf' };
    }

    // Verificar se o nome do arquivo não está vazio
    if (!file.name || file.name.trim().length === 0) {
      return { isValid: false, error: 'Nome do arquivo inválido' };
    }

    // Verificar se o nome do arquivo não contém caracteres perigosos
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.name)) {
      return { isValid: false, error: 'Nome do arquivo contém caracteres inválidos' };
    }

    return { isValid: true };
  }

  /**
   * Valida múltiplos arquivos PDF
   */
  static validatePDFs(files: FileList): { validFiles: File[]; errors: string[] } {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file, index) => {
      const validation = this.validatePDF(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`Arquivo ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    return { validFiles, errors };
  }

  /**
   * Sanitiza o nome do arquivo removendo caracteres perigosos
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Verifica se o navegador suporta as funcionalidades necessárias
   */
  static checkBrowserSupport(): { supported: boolean; missingFeatures: string[] } {
    const missingFeatures: string[] = [];

    // Verificar FileReader
    if (!window.FileReader) {
      missingFeatures.push('FileReader API');
    }

    // Verificar ArrayBuffer
    if (!window.ArrayBuffer) {
      missingFeatures.push('ArrayBuffer');
    }

    // Verificar URL.createObjectURL
    if (!window.URL || !window.URL.createObjectURL) {
      missingFeatures.push('URL.createObjectURL');
    }

    // Verificar Canvas (para renderização de PDF)
    if (!document.createElement('canvas').getContext) {
      missingFeatures.push('Canvas API');
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures
    };
  }
}
