import { NextRequest, NextResponse } from 'next/server';

// Interface que define a estrutura de dados jurídicos
export interface ExtractedLawData {
  numeroProcesso: string;
  partes: {
    autor: string;
    reu: string;
    outros: string;
  };
  tribunal: string;
  advogadosOab: string;
  datasRelevantes: {
    distribuicao: string;
    decisao: string;
    publicacao: string;
  };
  classeProcessual: string;
  assunto: string;
  magistradoRelator: string;
  valorCausa: string;
  ementa: string;
  dispositivo: string;
}

// Prompt do sistema estruturado para o Gemini
const SYSTEM_PROMPT = `Você é um assistente de IA especialista em Direito e Processo Civil e Penal Brasileiro.
Analise o texto do documento jurídico fornecido e extraia exatamente as seguintes informações estruturadas em formato JSON.
Siga rigorosamente este schema de resposta:

{
  "numeroProcesso": "Número completo do processo (preferencialmente no padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO). Se não houver, deixe em branco.",
  "partes": {
    "autor": "Nome completo do autor/requerente/exequente/impetrante. Se houver mais de um, separe por vírgula.",
    "reu": "Nome completo do réu/requerido/executado/impetrado. Se houver mais de um, separe por vírgula.",
    "outros": "Outros interessados/terceiros/assistentes se houver."
  },
  "tribunal": "Tribunal ou Órgão Julgador correspondente (ex: TJSP, TRF3, STJ, Vara Cível da Comarca de Curitiba, etc.)",
  "advogadosOab": "Nome dos advogados identificados no texto seguidos de suas respectivas inscrições da OAB (ex: João Silva OAB/SP 123.456, Maria Souza OAB/RJ 98.765). Separe por vírgula se houver mais de um.",
  "datasRelevantes": {
    "distribuicao": "Data de distribuição ou protocolo do processo. Se não houver, deixe em branco.",
    "decisao": "Data da decisão, sentença ou acórdão do documento. Se não houver, deixe em branco.",
    "publicacao": "Data de publicação ou intimação se mencionada. Se não houver, deixe em branco."
  },
  "classeProcessual": "A classe do processo (ex: Ação Ordinária, Mandado de Segurança, Execução de Título Extrajudicial, Habeas Corpus, Apelação Cível, etc.)",
  "assunto": "Assunto ou matéria principal do direito (ex: Contratos, Cobrança, Indenização por Dano Moral, Tributário, Consumidor, Furto, etc.)",
  "magistradoRelator": "Nome do Juiz, Desembargador Relator ou Ministro responsável pela decisão.",
  "valorCausa": "Valor da causa ou o valor fixado para condenação/acordo, se houver (ex: R$ 50.000,00).",
  "ementa": "O texto da ementa (resumo doutrinário/jurisprudencial no início de decisões de colegiados). Se não houver ementa explícita, faça um breve resumo de 2 a 3 linhas da controvérsia jurídica descrita no texto.",
  "dispositivo": "O dispositivo final ou a conclusão prática da decisão (ex: Julgo procedente o pedido..., Dou provimento ao recurso..., Concedo a ordem...). Extraia fielmente o trecho ou faça uma síntese direta do resultado."
}

Importante:
1. Responda apenas com o JSON estruturado. Não adicione introduções, explicações ou blocos markdown como "\`\`\`json".
2. Se uma informação específica não estiver presente no texto ou não puder ser identificada, deixe a propriedade como uma string vazia "".
3. Mantenha os nomes das partes e do processo exatamente como constam no documento.`;

// Função de simulação (Fallback) para testes sem API Key
function mockFieldExtraction(text: string): ExtractedLawData {
  const cleanText = text.toLowerCase();
  
  // Detecção heurística básica via regex simples
  const cnjRegex = /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g;
  const matchCnj = text.match(cnjRegex);
  const numeroProcesso = matchCnj ? matchCnj[0] : '';
  
  // Datas
  const dateRegex = /\b\d{2}\/\d{2}\/\d{4}\b/g;
  const matchDates = text.match(dateRegex) || [];
  const distribuicao = matchDates[0] || '';
  const decisao = matchDates[1] || '';
  
  // OAB
  const oabRegex = /oab\s*\/\s*[a-z]{2}\s*\d+[\d.\-]*/gi;
  const matchOab = text.match(oabRegex) || [];
  
  // Tentar encontrar nomes próximos de "OAB" ou assinaturas comuns
  let advogados = matchOab.length > 0 ? matchOab.join(', ') : 'Não detectado diretamente';

  // Partes (heurísticas simples para preenchimento)
  let autor = 'Requerente / Autor';
  let reu = 'Requerido / Réu';
  
  if (cleanText.includes('apelante')) {
    const lines = text.split('\n');
    const apelanteLine = lines.find(l => l.toLowerCase().includes('apelante'));
    if (apelanteLine) autor = apelanteLine.replace(/apelante:?/gi, '').trim();
  }
  
  if (cleanText.includes('apelado')) {
    const lines = text.split('\n');
    const apeladoLine = lines.find(l => l.toLowerCase().includes('apelado'));
    if (apeladoLine) reu = apeladoLine.replace(/apelado:?/gi, '').trim();
  }

  // Tribunais comuns
  let tribunal = 'Tribunal de Justiça';
  if (cleanText.includes('tjsp') || cleanText.includes('são paulo')) tribunal = 'Tribunal de Justiça de São Paulo (TJSP)';
  else if (cleanText.includes('tjmg') || cleanText.includes('minas gerais')) tribunal = 'Tribunal de Justiça de Minas Gerais (TJMG)';
  else if (cleanText.includes('tjrj') || cleanText.includes('rio de janeiro')) tribunal = 'Tribunal de Justiça do Rio de Janeiro (TJRJ)';
  else if (cleanText.includes('trf')) {
    const trfMatch = text.match(/trf\s*\d+/i);
    tribunal = trfMatch ? `Tribunal Regional Federal (${trfMatch[0].toUpperCase()})` : 'Tribunal Regional Federal';
  } else if (cleanText.includes('superior tribunal de justiça') || cleanText.includes('stj')) tribunal = 'Superior Tribunal de Justiça (STJ)';
  else if (cleanText.includes('supremo tribunal federal') || cleanText.includes('stf')) tribunal = 'Supremo Tribunal Federal (STF)';

  // Classe processual
  let classeProcessual = 'Petição/Documento Geral';
  if (cleanText.includes('petição inicial') || cleanText.includes('ação de')) classeProcessual = 'Ação de Conhecimento';
  else if (cleanText.includes('habeas corpus') || cleanText.includes('h.c.')) classeProcessual = 'Habeas Corpus';
  else if (cleanText.includes('mandado de segurança')) classeProcessual = 'Mandado de Segurança';
  else if (cleanText.includes('apelação')) classeProcessual = 'Apelação Cível / Criminal';
  else if (cleanText.includes('sentença')) classeProcessual = 'Sentença Judiciária';
  else if (cleanText.includes('acórdão')) classeProcessual = 'Acórdão Decisório';

  // Resumo/ementa e dispositivo fictícios com base no texto
  const ementa = text.length > 200 
    ? text.substring(0, 180) + '...' 
    : 'Documento contendo peticionamento judicial ordinário ou manifestação das partes.';
    
  const dispositivo = cleanText.includes('procedente')
    ? 'Julgo PROCEDENTE o pedido formulado na inicial...'
    : cleanText.includes('nego provimento')
    ? 'Negou-se provimento ao recurso interposto...'
    : 'Conclusão processual não identificada formalmente no fragmento.';

  return {
    numeroProcesso,
    partes: {
      autor,
      reu,
      outros: ''
    },
    tribunal,
    advogadosOab: advogados,
    datasRelevantes: {
      distribuicao,
      decisao,
      publicacao: matchDates[2] || ''
    },
    classeProcessual,
    assunto: 'Direito Processual / Geral',
    magistradoRelator: 'Magistrado não identificado',
    valorCausa: 'Não mencionado',
    ementa,
    dispositivo
  };
}

export async function POST(request: NextRequest) {
  let bodyText = '';
  try {
    const body = await request.json();
    bodyText = body.text || '';

    if (!bodyText || bodyText.trim() === '') {
      return NextResponse.json({ error: 'Texto não fornecido para extração' }, { status: 400 });
    }

    // Tentar obter a chave de API do Gemini do ambiente
    // Opcionalmente aceitamos também a de OpenAI caso o usuário tenha apenas ela e queira usá-la no futuro,
    // mas a prioridade é o Gemini.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY não configurada no arquivo de ambiente (.env). Retornando dados simulados.');
      // Executa o processamento via heurísticas como fallback inteligente
      const mockData = mockFieldExtraction(bodyText);
      return NextResponse.json({
        data: mockData,
        isSimulated: true,
        message: 'Aviso: Chave GEMINI_API_KEY não encontrada no servidor. Os campos foram gerados de forma simulada.'
      });
    }

    // Chamada oficial à API do Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nTexto do Documento:\n"""\n${bodyText}\n"""`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1 // Temperatura baixa para maior assertividade e menor alucinação
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API retornou erro status ${response.status}: ${errText}`);
    }

    const jsonResponse = await response.json();
    const candidateText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Nenhuma resposta gerada pelo modelo do Gemini.');
    }

    // Limpar possíveis blocos markdown que o modelo às vezes gera mesmo com instruções estritas
    let cleanJsonString = candidateText.trim();
    if (cleanJsonString.startsWith('```json')) {
      cleanJsonString = cleanJsonString.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJsonString.startsWith('```')) {
      cleanJsonString = cleanJsonString.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedData = JSON.parse(cleanJsonString);

    return NextResponse.json({
      data: parsedData,
      isSimulated: false
    });

  } catch (error) {
    console.error('Erro na extração de campos jurídicos:', error);
    
    // Fallback seguro usando a variável local
    const fallbackData = mockFieldExtraction(bodyText);
    
    return NextResponse.json({
      data: fallbackData,
      isSimulated: true,
      error: error instanceof Error ? error.message : 'Erro interno no processamento',
      message: 'Ocorreu um erro no processamento do Gemini. Os campos foram obtidos localmente via heurísticas.'
    });
  }
}
