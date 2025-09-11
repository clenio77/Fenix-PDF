# Fênix PDF - Ferramenta Interna de Edição

Uma aplicação web moderna para manipulação e edição de arquivos PDF, desenvolvida especificamente para os Correios.

## 🚀 Funcionalidades

### ✅ Implementadas

- **Upload de PDFs**: Suporte a múltiplos arquivos com drag-and-drop
- **Visualização**: Renderização de PDFs usando react-pdf
- **Edição de Texto**: Adicionar, editar e excluir anotações de texto
- **Manipulação de Páginas**: 
  - Reorganizar páginas via drag-and-drop
  - Rotacionar páginas (90°)
  - Excluir páginas
- **Geração de PDF**: Unir páginas e baixar PDF final
- **Interface Responsiva**: Design moderno e intuitivo

### 🛠️ Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **react-pdf** - Renderização de PDFs
- **pdf-lib** - Manipulação de PDFs
- **Canvas** - Suporte para renderização no servidor

## 📋 Requisitos Funcionais Atendidos

### Épico 1: Fundação e Visualização de PDF
- ✅ **FR1**: Upload de múltiplos arquivos PDF simultaneamente
- ✅ **FR2**: Visualização das páginas do PDF em interface de edição
- ✅ **FR3**: Adicionar novas caixas de texto em qualquer lugar da página

### Épico 2: Edição de Conteúdo
- ✅ **FR7**: Selecionar e editar texto existente (anotações adicionadas pela ferramenta)

### Épico 3: Estrutura e Organização de Páginas
- ✅ **FR4**: Reorganizar, rotacionar e deletar páginas do PDF
- ✅ **FR5**: Selecionar múltiplos PDFs e uni-los em um único arquivo
- ✅ **FR6**: Baixar o PDF resultante como um novo arquivo

## 🏗️ Arquitetura

### Método BMAD (Business Model Analysis and Design)

O projeto foi implementado seguindo o método BMAD com agentes especializados:

1. **Agente de Fundação**: Implementou a base da aplicação e visualização
2. **Agente de Edição**: Desenvolveu as ferramentas de edição de conteúdo
3. **Agente de Estrutura**: Criou as funcionalidades de manipulação de páginas
4. **Agente de Serviços**: Implementou o PDFService com pdf-lib

### Estrutura de Componentes

```
src/
├── app/
│   ├── globals.css          # Estilos globais
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página principal
├── components/
│   ├── FileUpload.tsx       # Upload de arquivos
│   ├── FileViewer.tsx       # Visualizador de PDF
│   ├── FileList.tsx         # Lista de páginas
│   ├── Toolbox.tsx          # Barra de ferramentas
│   └── TextEditor.tsx       # Editor de anotações
└── lib/
    ├── types.ts             # Definições de tipos
    └── pdfService.ts        # Serviços de manipulação de PDF
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```

### Build de Produção
```bash
npm run build
npm start
```

## 📱 Como Usar

1. **Upload**: Arraste e solte arquivos PDF ou clique para selecionar
2. **Visualizar**: Navegue pelas páginas usando os controles
3. **Editar**: 
   - Selecione a ferramenta "Adicionar Texto"
   - Clique em qualquer lugar da página para adicionar anotação
   - Use "Selecionar" para editar anotações existentes
4. **Manipular Páginas**:
   - Arraste páginas para reordenar
   - Use os botões de rotação e exclusão no hover
5. **Exportar**: Clique em "Salvar e Baixar" para gerar o PDF final

## 🔒 Segurança

- Todo processamento ocorre no navegador (client-side)
- Nenhum arquivo é enviado para servidores externos
- Compatível com documentos sensíveis

## 🌐 Compatibilidade

- Google Chrome (versões recentes)
- Mozilla Firefox (versões recentes)  
- Microsoft Edge (versões recentes)
- Design responsivo para desktop e mobile

## 📄 Licença

Projeto interno dos Correios - Uso restrito.

## 👥 Desenvolvimento

Implementado seguindo o método BMAD com agentes especializados para garantir:
- Código modular e manutenível
- Separação clara de responsabilidades
- Implementação incremental das funcionalidades
- Testes e validação contínua

---

**Versão**: 1.0  
**Data**: Janeiro 2025  
**Status**: ✅ Implementação Completa