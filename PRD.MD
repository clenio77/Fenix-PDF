# PRD: Fênix PDF - Ferramenta Interna de Edição

**Versão:** 1.4
**Autor:** John (PM)
**Data:** 11/09/2025

## 1. Visão Geral e Objetivos

Este documento descreve os requisitos para o "Fênix PDF", uma aplicação web interna para os Correios, projetada para centralizar e simplificar a manipulação de arquivos PDF. O objetivo principal é aumentar a produtividade dos funcionários e reduzir os custos com licenças de softwares de terceiros, oferecendo uma ferramenta segura e eficiente que funciona inteiramente no navegador do usuário.

## 2. Requisitos Funcionais (FR)

* **FR1:** O usuário deve poder fazer o upload de múltiplos arquivos PDF simultaneamente a partir de seu dispositivo.
* **FR2:** O usuário deve poder visualizar as páginas do PDF carregado em uma interface de edição.
* **FR3:** O usuário deve poder adicionar novas caixas de texto em qualquer lugar de uma página.
* **FR4:** O usuário deve poder reorganizar, rotacionar e deletar páginas do PDF.
* **FR5:** O usuário deve poder selecionar múltiplos PDFs (ou páginas) e uni-los em um único arquivo, definindo a ordem final.
* **FR6:** O usuário deve poder baixar o PDF resultante como um novo arquivo.
* **FR7:** O usuário deve poder selecionar e editar o texto existente dentro de um documento PDF (aplicável apenas ao texto adicionado pela própria ferramenta no MVP).

## 3. Requisitos Não Funcionais (NFR)

* **NFR1:** A aplicação deve ser acessível de forma segura tanto pela rede interna dos Correios quanto pela internet.
* **NFR2:** Todo o processamento de arquivos deve ocorrer no navegador do cliente para que documentos sensíveis nunca sejam enviados a um servidor.
* **NFR3:** A interface deve ser simples e localizada em Português (Brasil).
* **NFR4:** A aplicação deve ser compatível com os navegadores Google Chrome, Mozilla Firefox e Microsoft Edge, em suas versões mais recentes.
* **NFR5:** Para garantir o acesso seguro via internet, o usuário deverá se autenticar com suas credenciais corporativas dos Correios.
* **NFR6:** A aplicação deve possuir capacidade offline básica, permitindo que o usuário abra a interface e execute todas as operações de manipulação de PDF em arquivos locais sem uma conexão ativa com a internet.

## 4. Premissas Técnicas

* **Framework Principal:** Next.js
* **Plataformas Alvo:** A aplicação será uma Progressive Web App (PWA), garantindo uma experiência otimizada tanto em navegadores de desktop quanto em dispositivos móveis com um design totalmente responsivo.

## 5. Estrutura de Épicos

* **Épico 1: Fundação e Visualização de PDF:** Estabelecer a base da aplicação, permitindo que os usuários carreguem e visualizem seus documentos.
* **Épico 2: Edição de Conteúdo:** Implementar as ferramentas de edição de conteúdo, como adicionar e modificar texto.
* **Épico 3: Estrutura e Organização de Páginas:** Fornecer ferramentas para a manipulação estrutural dos documentos, como reorganizar, unir e exportar.
* **Épico 4: Autenticação e Acesso Seguro:** Garantir que a aplicação seja segura e acessível apenas por usuários autorizados.