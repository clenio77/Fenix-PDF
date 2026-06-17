import { NextRequest, NextResponse } from 'next/server';

const MAX_MARKDOWN_LENGTH = 200_000;
const MAX_EDITS = 500;

type WorkflowEdit = {
  antigo?: string;
  novo?: string;
};

function parseEdits(rawEdits: FormDataEntryValue | null): WorkflowEdit[] {
  if (!rawEdits || typeof rawEdits !== 'string') {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawEdits);
  } catch {
    throw new Error('Formato inválido para o campo "edits"');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('O campo "edits" deve ser um array');
  }

  if (parsed.length > MAX_EDITS) {
    throw new Error(`Quantidade máxima de edições excedida (${MAX_EDITS})`);
  }

  return parsed;
}

function isLikelyPdfFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.pdf');
}

function validateMarkdownSize(markdown: string): void {
  if (markdown.length > MAX_MARKDOWN_LENGTH) {
    throw new Error(`Conteúdo Markdown excede o limite de ${MAX_MARKDOWN_LENGTH} caracteres`);
  }
}

// Simulação do MarkItDown para conversão PDF → Markdown
// Em produção, isso seria uma chamada para um serviço Python com MarkItDown
async function convertPDFToMarkdown(pdfFile: File): Promise<string> {
  // Simulação baseada no nome do arquivo (como no OCR atual)
  const fileName = pdfFile.name.toLowerCase();
  
  if (fileName.includes('jurado') || fileName.includes('lista')) {
    return `# ATA DO SORTEIO DOS JURADOS

## PODER JUDICIÁRIO DO ESTADO DE MINAS GERAIS
### COMARCA DE BELO HORIZONTE

Aos onze dias do mês de agosto de dois mil e vinte e cinco, às dezessete horas e cinquenta minutos, na sala de audiências desta Comarca, presentes o Excelentíssimo Senhor Doutor Juiz de Direito Dr. André Ricardo Botasso e o Doutor Leonardo Martins Couto, Defensor Público, procedeu-se ao sorteio dos jurados para as sessões ordinárias do mês de setembro de dois mil e vinte e cinco.

## LISTA DOS JURADOS SORTEADOS:

1. FÁBIO EDUARDO DE OLIVEIRA
2. MARIA SILVA SANTOS
3. JOÃO CARLOS PEREIRA
4. ANA PAULA COSTA
5. CARLOS ALBERTO SOUZA
6. FERNANDA OLIVEIRA LIMA
7. ROBERTO SILVA SANTOS
8. PATRICIA COSTA PEREIRA
9. MARCOS ANTONIO SOUZA
10. JULIANA FERREIRA LIMA
11. RICARDO PEREIRA SANTOS
12. LUCIA MARIA COSTA
13. ANTONIO CARLOS OLIVEIRA
14. MARIA FERNANDA SOUZA
15. PEDRO HENRIQUE LIMA
16. CAROLINA SILVA PEREIRA
17. FERNANDO COSTA SANTOS
18. AMANDA OLIVEIRA SOUZA
19. BRUNO PEREIRA LIMA
20. RITA DE CASSIA LIMA
21. MARCIO ALVES DE OLIVEIRA
22. JUSSÂNIA OLIVEIRA DE FARIA
23. ELOAINY ALVES EUSTAQUIO
24. CARLOS EDUARDO SILVA
25. MARIA APARECIDA COSTA

**Processo:** 1234567-89.2025.8.13.0024  
**Data:** 11/08/2025  
**Horário:** 17:50`;
  } else {
    return `# DOCUMENTO PDF PROCESSADO VIA MARKDOWN

Este documento foi convertido de PDF para Markdown usando tecnologia avançada de conversão.

## CONTEÚDO DO DOCUMENTO

### Página 1: Informações principais
- Informações principais do documento
- Detalhes importantes
- Dados relevantes

### Página 2: Detalhes adicionais
- Especificações técnicas
- Parâmetros de configuração
- Valores de referência

### Página 3: Conclusões
- Dados finais
- Resultados obtidos
- Recomendações

## OBSERVAÇÕES

O sistema de conversão detectou automaticamente que este PDF possui texto selecionável e aplicou conversão direta para Markdown, preservando a estrutura e formatação do documento original.

**Data de processamento:** ${new Date().toLocaleDateString('pt-BR')}  
**Arquivo original:** ${pdfFile.name}

---

*Este documento foi processado usando o fluxo PDF → Markdown → Edição → PDF*`;
  }
}

// Simulação do Pandoc para conversão Markdown → PDF
async function convertMarkdownToPDF(markdown: string): Promise<Buffer> {
  // Em produção, isso seria uma chamada para Pandoc ou similar
  // Por enquanto, vamos criar um PDF simples usando pdf-lib
  
  const { PDFDocument, rgb } = await import('pdf-lib');
  
  const pdfDoc = await PDFDocument.create();
  const pageSize: [number, number] = [595, 842]; // A4
  let currentPage = pdfDoc.addPage(pageSize);
  
  // Dividir markdown em linhas e processar
  const lines = markdown.split('\n');
  let y = 800;
  let fontSize = 12;
  
  for (const line of lines) {
    if (line.trim() === '') {
      y -= 10; // Espaço em branco
      continue;
    }
    
    // Processar formatação Markdown
    let text = line;
    let currentFontSize = fontSize;
    let currentColor = rgb(0, 0, 0);
    
    // Títulos
    if (line.startsWith('# ')) {
      text = line.substring(2);
      currentFontSize = 18;
      currentColor = rgb(0, 0, 0.8);
    } else if (line.startsWith('## ')) {
      text = line.substring(3);
      currentFontSize = 16;
      currentColor = rgb(0, 0, 0.6);
    } else if (line.startsWith('### ')) {
      text = line.substring(4);
      currentFontSize = 14;
      currentColor = rgb(0, 0, 0.4);
    }
    
    // Listas
    if (line.startsWith('- ') || line.startsWith('* ')) {
      text = '• ' + line.substring(2);
    } else if (/^\d+\. /.test(line)) {
      // Lista numerada - manter como está
    }
    
    // Negrito
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Itálico
    text = text.replace(/\*(.*?)\*/g, '$1');
    
    // Desenhar texto
    if (text.trim()) {
      currentPage.drawText(text, {
        x: 50,
        y: y,
        size: currentFontSize,
        color: currentColor,
      });
    }
    
    y -= currentFontSize + 5;
    
    // Nova página se necessário
    if (y < 50) {
      currentPage = pdfDoc.addPage(pageSize);
      y = 800;
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfEntry = formData.get('pdf');
    const pdfFile = pdfEntry instanceof File ? pdfEntry : null;
    const edits = parseEdits(formData.get('edits'));
    const markdownEntry = formData.get('markdownContent');
    const markdownContent = typeof markdownEntry === 'string' ? markdownEntry : '';

    if (!pdfFile && !markdownContent) {
      return NextResponse.json({ error: 'PDF ou conteúdo Markdown não fornecido' }, { status: 400 });
    }

    if (pdfFile && !isLikelyPdfFile(pdfFile)) {
      return NextResponse.json({ error: 'Arquivo inválido. Envie um PDF válido.' }, { status: 400 });
    }

    let finalMarkdown: string;

    if (markdownContent) {
      // Se já temos o conteúdo Markdown editado, usar diretamente
      finalMarkdown = markdownContent;
    } else if (pdfFile) {
      // Converter PDF para Markdown
      const originalMarkdown = await convertPDFToMarkdown(pdfFile);
      
      // Aplicar edições
      finalMarkdown = originalMarkdown;
      edits.forEach((edit) => {
        if (typeof edit.antigo === 'string' && typeof edit.novo === 'string' && edit.antigo && edit.novo) {
          try {
            const textoEscapado = edit.antigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(textoEscapado, 'gi');
            finalMarkdown = finalMarkdown.replace(regex, edit.novo);
          } catch (error) {
            console.error('Erro na regex:', error);
            finalMarkdown = finalMarkdown.replace(
              new RegExp(edit.antigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
              edit.novo
            );
          }
        }
      });
    } else {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    validateMarkdownSize(finalMarkdown);

    // Converter Markdown para PDF
    const pdfBuffer = await convertMarkdownToPDF(finalMarkdown);

    // Retornar o PDF editado
    const fileName = `pdf_markdown_editado_${Date.now()}.pdf`;
    
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Erro no fluxo PDF-Markdown:', error);
    return NextResponse.json({ 
      error: 'Erro interno: ' + (error as Error).message 
    }, { status: 500 });
  }
}

// Endpoint para obter apenas o Markdown (sem converter para PDF)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pdfFile = searchParams.get('pdfFile');
    
    if (!pdfFile) {
      return NextResponse.json({ error: 'Parâmetro pdfFile necessário' }, { status: 400 });
    }

    // Simular conversão PDF → Markdown
    const mockFile = new File([], pdfFile);
    const markdown = await convertPDFToMarkdown(mockFile);
    
    return NextResponse.json({
      markdown,
      fileName: pdfFile,
      convertedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro ao converter PDF para Markdown:', error);
    return NextResponse.json({ 
      error: 'Erro interno: ' + (error as Error).message 
    }, { status: 500 });
  }
}
