# Fênix PDF

Ferramenta web interna dos Correios para visualizar, organizar e exportar PDFs no navegador.

**Versão:** 0.2.0  
**Status:** MVP utilizável — núcleo de visualização/export consolidado; algumas ferramentas avançadas ainda marcadas como “Em breve”.

## O que funciona hoje

| Capacidade | Situação |
|---|---|
| Upload múltiplo (drag-and-drop) | Sim |
| Visualização (zoom, navegação) | Sim (`react-pdf`) |
| Anotações de texto (adicionar / editar / excluir) | Sim — overlays; entram no PDF ao baixar |
| Reordenar páginas (drag-and-drop) | Sim |
| Rotacionar páginas (90°) | Sim — aplicado no export |
| Excluir páginas | Sim — da lista de exportação |
| Unir PDFs | Sim |
| Comprimir PDFs | Sim — reescrita estrutural (pdf-lib); redução costuma ser modesta; **nunca remove páginas** |
| Baixar PDF (botão + Ctrl+S) | Sim — honra ordem, rotação, exclusões e anotações |
| Scanner + OCR (Tesseract, pt) | Sim — no navegador |
| Extração jurídica (Gemini) | Opcional — requer `GEMINI_API_KEY`; envia texto à API |
| Editar texto nativo do PDF | Em breve (desabilitado na UI) |
| Buscar e substituir / analisar estrutura | Em breve (desabilitado na UI) |
| Workflow Markdown real (MarkItDown/Pandoc) | Parcial / simulado — não tratar como produção |
| Autenticação corporativa | Não implementada |
| Testes automatizados / CI | Não |

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- `react-pdf` + `pdf-lib` + `tesseract.js`
- PWA (`next-pwa`)
- API opcional: Google Gemini (`/api/extract-fields`)

## Como executar

```bash
npm install
cp .env.example .env   # opcional: GEMINI_API_KEY=
npm run dev
```

Build:

```bash
npm run build && npm start
```

## Como usar

1. Faça upload de PDFs no sidebar.
2. Aguarde as páginas aparecerem na grade **Páginas** e no visualizador.
3. **Adicionar Texto** — clique na página; **Selecionar** — clique numa anotação para editar.
4. Na grade de páginas: arraste para reordenar, rotacione ou exclua.
5. Clique em **Baixar PDF** (header ou área principal) ou use **Ctrl+S**.
6. Opcional: **Unir**, **Comprimir**, ou **Scanner & Extração** (OCR / Gemini).

## Privacidade e dados

- Visualização, merge, compressão, anotações e OCR rodam **no navegador**.
- A extração jurídica com Gemini envia o **texto extraído** para a API do Google quando a chave está configurada. Não use com documentos sigilosos sem autorização.
- O fluxo Markdown via `/api/pdf-markdown-workflow` passa pelo servidor e hoje é em grande parte simulado.

## Estrutura principal

```
src/
├── app/
│   ├── page.tsx                 # Shell e orquestração de estado
│   ├── api/extract-fields/      # Extração Gemini (+ fallback heurístico)
│   └── api/pdf-markdown-workflow/
├── components/
│   ├── Sidebar.tsx              # Upload, ferramentas, merge/compress
│   ├── FileViewer.tsx           # Viewer + anotações
│   ├── FileList.tsx             # Reordenar / rotacionar / excluir
│   └── ScannerExtractor.tsx     # OCR + metadados jurídicos
└── lib/
    ├── pdfService.ts            # Manipulação e export (pdf-lib)
    └── types.ts
```

## Limitações conhecidas

- Compressão não re-encoda imagens em JPEG agressivo; ganho de tamanho limitado.
- Mover páginas **entre** documentos diferentes no FileList não reescreve o `File` de origem até o export por documento — prefira reordenar dentro do mesmo PDF ou usar Unir + baixar.
- Undo/redo (Ctrl+Z/Y) ainda não registra a maioria das ações.
- Sem autenticação; não expor publicamente sem controle de acesso.
- Documentação antiga em vários `*.md` da raiz pode estar desatualizada — este README é a fonte de verdade.

## Licença

Uso interno dos Correios — restrito.
