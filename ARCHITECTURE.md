# Arquitetura do Sistema - Fênix PDF

## Visão Geral

O Fênix PDF foi implementado seguindo o método BMAD (Business Model Analysis and Design) com agentes especializados, garantindo uma arquitetura modular, escalável e manutenível.

## Método BMAD com Agentes

### 1. Agente de Fundação
**Responsabilidade**: Estabelecer a base da aplicação
- Implementou upload de arquivos com drag-and-drop
- Configurou visualização de PDFs com react-pdf
- Criou estrutura de componentes base

### 2. Agente de Edição
**Responsabilidade**: Ferramentas de edição de conteúdo
- Desenvolveu sistema de anotações de texto
- Implementou editor inline com formatação
- Criou gerenciamento de estado das anotações

### 3. Agente de Estrutura
**Responsabilidade**: Manipulação de páginas
- Implementou drag-and-drop para reordenação
- Desenvolveu rotação e exclusão de páginas
- Criou interface de miniaturas

### 4. Agente de Serviços
**Responsabilidade**: Processamento de PDFs
- Implementou PDFService com pdf-lib
- Desenvolveu geração de PDF final
- Criou conversões e manipulações

## Arquitetura de Componentes

```
App (page.tsx)
├── FileUpload
│   └── PDFService.loadPDF()
├── FileList
│   ├── Drag & Drop
│   ├── Rotate Pages
│   └── Delete Pages
├── Toolbox
│   ├── Select Tool
│   └── Text Tool
└── FileViewer
    ├── react-pdf Document/Page
    ├── Text Annotations
    └── TextEditor
```

## Fluxo de Dados

### 1. Upload de Arquivos
```
User → FileUpload → PDFService.loadPDF() → PDFDocument[] → App State
```

### 2. Edição de Texto
```
User Click → FileViewer → TextEditor → PDFService.addTextAnnotation() → App State
```

### 3. Manipulação de Páginas
```
User Drag → FileList → PDFService.reorderPages() → App State
User Click → FileList → PDFService.rotatePage() → App State
```

### 4. Geração de PDF
```
User Click → App → PDFService.generatePDF() → Blob → Download
```

## Tecnologias e Padrões

### Frontend
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização utilitária
- **React Hooks**: Gerenciamento de estado

### PDF Processing
- **react-pdf**: Renderização de PDFs no navegador
- **pdf-lib**: Manipulação e geração de PDFs
- **Canvas API**: Suporte para renderização

### Padrões de Design
- **Component Composition**: Componentes reutilizáveis
- **Props Drilling**: Comunicação entre componentes
- **Service Layer**: Separação de lógica de negócio
- **State Management**: useState para estado local

## Estrutura de Dados

### PDFDocument
```typescript
interface PDFDocument {
  id: string;
  name: string;
  size: number;
  pages: PDFPage[];
  file: File;
  pdfDoc?: any; // Instância do PDFLib
}
```

### PDFPage
```typescript
interface PDFPage {
  id: string;
  index: number;
  rotation: number;
  textAnnotations: TextAnnotation[];
  width: number;
  height: number;
}
```

### TextAnnotation
```typescript
interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}
```

## Segurança e Performance

### Segurança
- **Client-side Processing**: Nenhum arquivo enviado para servidor
- **Type Safety**: TypeScript previne erros de tipo
- **Input Validation**: Validação de arquivos PDF

### Performance
- **Lazy Loading**: Componentes carregados sob demanda
- **Memoization**: React.memo para otimização
- **Efficient Rendering**: Minimização de re-renders
- **Bundle Optimization**: Next.js otimiza automaticamente

## Escalabilidade

### Modularidade
- Cada agente é independente
- Componentes podem ser reutilizados
- Serviços podem ser testados isoladamente

### Extensibilidade
- Fácil adição de novas ferramentas
- Sistema de plugins para funcionalidades
- API consistente para novos recursos

## Monitoramento e Debugging

### Development Tools
- **React DevTools**: Debug de componentes
- **TypeScript**: Verificação de tipos em tempo real
- **ESLint**: Análise de código
- **Next.js Dev Server**: Hot reload

### Error Handling
- **Try-catch**: Tratamento de erros em operações assíncronas
- **User Feedback**: Mensagens de erro amigáveis
- **Graceful Degradation**: Funcionalidades continuam funcionando

## Conclusão

A arquitetura implementada com o método BMAD garante:
- **Manutenibilidade**: Código organizado e documentado
- **Testabilidade**: Componentes isolados e testáveis
- **Escalabilidade**: Fácil adição de novas funcionalidades
- **Performance**: Otimizada para uso em produção
- **Segurança**: Processamento local sem vazamento de dados

O sistema está pronto para uso em produção e pode ser facilmente estendido conforme novas necessidades dos usuários dos Correios.