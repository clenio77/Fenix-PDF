## Épico 1: Fundação e Visualização de PDF

**Objetivo:** Estabelecer a base da aplicação, permitindo que os usuários carreguem e visualizem seus documentos PDF de forma eficiente.

---

### **História 1.1: Configuração Inicial do Projeto**
* **Como um** desenvolvedor,
* **Eu quero** configurar a estrutura inicial da aplicação web,
* **Para que** tenhamos uma base de código limpa e pronta para o desenvolvimento das funcionalidades.
* **Critérios de Aceitação:**
    1.  O projeto inicial da aplicação web com Next.js e TypeScript deve ser criado.
    2.  A aplicação deve ser capaz de ser executada localmente em um navegador (`npm run dev`).
    3.  A estrutura de pastas básica (`/app`, `/components`, `/lib`) deve ser criada conforme o documento de arquitetura.

---

### **História 1.2: Upload de Arquivos PDF**
* **Como um** usuário dos Correios,
* **Eu quero** um botão para selecionar um ou mais arquivos PDF do meu computador,
* **Para que** eu possa carregá-los na aplicação para edição.
* **Critérios de Aceitação:**
    1.  Deve haver um componente de botão ou uma área de "arrastar e soltar" claramente visível na interface.
    2.  Ao clicar no botão, o seletor de arquivos do sistema operacional deve ser aberto.
    3.  O seletor de arquivos deve permitir a seleção de múltiplos arquivos e ser restrito a arquivos com a extensão `.pdf`.
    4.  Após a seleção, os nomes dos arquivos carregados devem ser exibidos em uma lista na tela.

---

### **História 1.3: Interface de Visualização de PDF**
* **Como um** usuário dos Correios,
* **Eu quero** ver o conteúdo do PDF que eu carreguei,
* **Para que** eu possa navegar por suas páginas e prepará-lo para a edição.
* **Critérios de Aceitação:**
    1.  Após o upload de um arquivo, seu conteúdo deve ser renderizado em uma área de visualização principal.
    2.  Todas as páginas do PDF devem ser exibidas verticalmente.
    3.  O usuário deve ser capaz de rolar para navegar entre as páginas.
    4.  Um contador (ex: "Página 1 de 10") deve ser visível.


## Épico 2: Edição de Conteúdo

**Objetivo:** Implementar as ferramentas de edição de conteúdo, permitindo que usuários adicionem novas informações e modifiquem o texto existente nos PDFs.

---

### **História 2.1: Adicionar Caixa de Texto**
* **Como um** usuário dos Correios,
* **Eu quero** poder clicar em qualquer lugar de uma página do PDF e adicionar uma nova caixa de texto,
* **Para que** eu possa inserir anotações e informações adicionais.
* **Critérios de Aceitação:**
    1.  Deve haver um botão "Adicionar Texto" na caixa de ferramentas (`Toolbox`).
    2.  Quando o modo "Adicionar Texto" está ativo, o cursor do mouse sobre o `FileViewer` deve mudar para um cursor de texto.
    3.  Ao clicar em qualquer lugar da página, uma caixa de texto editável deve aparecer naquela posição.
    4.  O texto digitado pelo usuário deve ser salvo no estado da aplicação associado àquela página e posição.

---

### **História 2.2: Editar Texto Existente**
* **Como um** usuário dos Correios,
* **Eu quero** poder clicar em uma caixa de texto que eu adicionei anteriormente para editar seu conteúdo,
* **Para que** eu possa corrigir erros ou alterar informações.
* **Critérios de Aceitação:**
    1.  Deve haver uma ferramenta de "Seleção/Edição" no `Toolbox`.
    2.  Quando este modo está ativo, o usuário deve poder clicar em uma caixa de texto adicionada anteriormente.
    3.  Ao ser clicada, a caixa de texto deve se tornar um campo de input editável, preenchido com o texto atual.
    4.  Após a edição, ao clicar fora da caixa (on blur), o novo texto deve ser salvo no estado da aplicação.


## Épico 3: Estrutura e Organização de Páginas

**Objetivo:** Fornecer ferramentas para a manipulação estrutural dos documentos, como reorganizar, unir e exportar páginas e arquivos.

---

### **História 3.1: Reorganizar Páginas**
* **Como um** usuário dos Correios,
* **Eu quero** visualizar as páginas de todos os PDFs carregados e poder arrastá-las para reordená-las,
* **Para que** eu possa montar a estrutura final do meu documento compilado.
* **Critérios de Aceitação:**
    1.  Deve haver um painel lateral (`FileList`) que exibe miniaturas de todas as páginas de todos os arquivos carregados.
    2.  O usuário deve poder arrastar e soltar (`drag-and-drop`) qualquer miniatura de página para uma nova posição na lista.
    3.  A nova ordem das páginas deve ser refletida visualmente e salva no estado da aplicação.
    4.  Deve ser possível arrastar uma página de um PDF para o meio de outro PDF na lista de visualização.

---

### **História 3.2: Rotacionar Páginas**
* **Como um** usuário dos Correios,
* **Eu quero** um botão para rotacionar uma página selecionada,
* **Para que** eu possa corrigir a orientação de páginas que foram digitalizadas incorretamente.
* **Critérios de Aceitação:**
    1.  Ao passar o mouse sobre uma miniatura de página no `FileList`, um ícone de "Rotacionar" deve aparecer.
    2.  Cada clique no ícone deve rotacionar a página em 90 graus no sentido horário.
    3.  A rotação deve ser aplicada na visualização principal (`FileViewer`) e salva no estado da aplicação.

---

### **História 3.3: Deletar Páginas**
* **Como um** usuário dos Correios,
* **Eu quero** um botão para deletar uma página selecionada,
* **Para que** eu possa remover conteúdo desnecessário do meu documento final.
* **Critérios de Aceitação:**
    1.  Ao passar o mouse sobre uma miniatura de página no `FileList`, um ícone de "Deletar" deve aparecer.
    2.  Ao clicar no ícone, uma confirmação ("Você tem certeza?") deve ser exibida.
    3.  Após a confirmação, a página deve ser removida da lista e do estado da aplicação.

---

### **História 3.4: Unir e Baixar PDF**
* **Como um** usuário dos Correios,
* **Eu quero** um botão para "Salvar e Baixar",
* **Para que** eu possa obter o arquivo PDF final com todas as minhas páginas reordenadas e editadas.
* **Critérios de Aceitação:**
    1.  Deve haver um botão "Salvar e Baixar" claramente visível na interface.
    2.  Ao clicar no botão, a aplicação deve pegar a lista final de páginas e suas edições do `PDFEngine`.
    3.  A aplicação deve gerar um novo arquivo PDF contendo todas as páginas na ordem definida, com todas as edições e rotações aplicadas.
    4.  O navegador deve iniciar o download do novo arquivo PDF, nomeado `documento-compilado.pdf`.        