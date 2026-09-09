# Test Data DevTools

Extensão Chrome para gerar dados sintéticos de desenvolvimento e QA dentro do Chrome DevTools.

## Stack

- TypeScript
- Vite
- Preact
- CSS próprio
- Manifest V3
- Vitest

## Desenvolvimento

```bash
npm install
npm test
npm run build
```

## Instalação local no Chrome

1. Execute `npm run build`.
2. Abra `chrome://extensions`.
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `dist`.
6. Abra o DevTools de qualquer página e selecione o painel **Test Data**.

Depois de um novo build, use **Recarregar** em `chrome://extensions`. Se o Chrome continuar exibindo um erro antigo do service worker, remova a instalação anterior e carregue novamente a pasta `dist`; o manifesto atual aponta para `assets/background.js`, que é um bundle autocontido.

Também é possível clicar no ícone da extensão na barra do Chrome para abrir o popup **Test Data**. O popup reutiliza os mesmos geradores, histórico e ações do painel DevTools e é indicado para gerar um valor sem abrir as ferramentas do desenvolvedor.

Para CPF, CNPJ, CEP, telefone e data/hora, use a opção **Usar máscara** para alternar entre os formatos legível e sem máscara. O gerador **Data** usa `YYYY-MM-DD` sem máscara para funcionar diretamente com `<input type="date">`. Para cartões, escolha a bandeira e, quando necessário, desative a máscara para copiar somente os dígitos. Os cartões disponíveis são números conhecidos de teste de Visa, Mastercard, American Express e Elo.

O preset **Pessoa física** gera um conjunto JSON coerente com nome, CPF, e-mail baseado no nome, telefone, data de nascimento e senha. Ele pode ser copiado como um único payload para testes de cadastro.

O preset **Pessoa jurídica** gera razão social, CNPJ, e-mail corporativo, telefone, CEP, cidade e estado em um único JSON.

O preset **Endereço** gera CEP, rua, número, complemento, bairro, cidade e estado em um único JSON, sem consultar serviços externos.

O preset **Casos de borda** gera valores como vazio, espaços, `null`, zero, negativo, Unicode, emoji, caracteres especiais e texto longo para testar validações.

O preset **Resposta de API** gera uma resposta paginada com `data`, metadados de paginação e links `self`/`next`, útil para testar tabelas, listagens e clientes HTTP.

O preset **Erro de API** gera respostas HTTP sintéticas com status `400`, `401`, `404`, `422` ou `500`, incluindo código, mensagem, `requestId` e detalhes de validação quando aplicável.

Os geradores de CPF, CNPJ, CEP, telefone, e-mail e UUID possuem o botão **Validar**, que verifica o resultado atual sem modificá-lo.

Os geradores técnicos **URL** e **IP** usam `example.com` e a faixa IPv4 `192.0.2.0/24`, reservados para documentação e testes.

Os geradores financeiros **Valor monetário** e **Percentual** aceitam máscara brasileira (`R$ 1.234,56` e `12,50%`) ou valores sem formatação (`1234.56` e `12.50`).

Também estão disponíveis os geradores técnicos **Booleano**, **Número inteiro** e **Cor hexadecimal**, úteis para payloads e regras de interface.

O gerador **Timestamp** atende testes de logs e integrações usando milissegundos Unix.

O gerador **Senha** aceita tamanhos entre 4 e 64 caracteres. O gerador **Texto aleatório** permite controlar a quantidade de dígitos do sufixo.

As preferências de máscara, bandeira do cartão, tamanhos e quantidade do lote são salvas localmente pela extensão e restauradas na próxima abertura.

Use **Quantidade** e **Gerar lote JSON** para criar de 2 a 100 valores do gerador selecionado. O resultado pode ser copiado como JSON; no preset **Pessoa física**, cada item do lote é um objeto coerente, não uma string JSON.

Depois de gerar um lote, use **Baixar JSON** ou **Baixar CSV** para salvar os dados localmente. O CSV usa as chaves dos objetos como colunas e valores simples como uma coluna `valor`.

Na interface, os geradores de campos ficam sempre visíveis e os presets ficam agrupados em uma seção recolhida **Presets**, pois são usados com menos frequência. Abra essa seção somente quando precisar gerar um conjunto como **Pessoa física**.

Use a busca no topo para filtrar geradores por nome, categoria ou descrição.

Os itens do histórico são clicáveis. Clique em um valor anterior para restaurá-lo no resultado atual e copiá-lo ou inseri-lo novamente.

No painel DevTools, selecione um campo de formulário na página inspecionada, gere um valor e use **Inserir no campo ativo**. A extensão atualiza o campo e dispara os eventos `input` e `change`; o popup não exibe essa ação porque não está vinculado a uma página inspecionada.

Use **Mapear campos** na seção **Preenchimento em lote** para listar os inputs, textareas e selects da página. Os campos reconhecidos já aparecem selecionados; revise a lista e clique em **Preencher selecionados** para gerar e inserir todos de uma vez. Campos sem sugestão ficam desabilitados para evitar preenchimentos incorretos.

Use **Detectar campo** depois de selecionar um input para identificar `name`, `id`, `placeholder` e tipo. Quando reconhecer termos como `cpf`, `taxvat`, `cnpj`, `company`, `empresa`, `cep`, `zip`, `postal`, `estado`, `state`, `uf`, `cidade`, `city`, `email`, `telefone`, `fax`, `data de nascimento`, `nome`, `password`, `senha` ou `passwd`, ou quando o campo tiver `type="password"`, o painel selecionará automaticamente o gerador correspondente e gerará um novo valor. A detecção não altera o campo; a inserção continua sendo uma ação explícita.

Campos de nome são tratados por prioridade:

- `firstname`, `first-name`, `first_name`, `given-name` e `primeiro nome` usam **Primeiro nome**.
- `lastname`, `last-name`, `last_name`, `family-name` e `sobrenome` usam **Sobrenome**.
- Outros campos com `name` ou `nome` usam **Nome completo**.

Assim, `input[firstname]` e `input[lastname]` podem ser preenchidos separadamente sem receber um nome completo por engano. Para o preset **Pessoa física**, a geração continua usando um nome completo coerente.

Em páginas comuns, também é possível clicar com o botão direito em um campo editável e usar **Gerar dado de teste**. O submenu oferece nome, primeiro nome, sobrenome, CPF, CNPJ, CEP, estado, cidade, data, e-mail, telefone e senha; a escolha foca o campo, preenche o valor, dispara `input` e `change` e finaliza com `blur` para ativar máscaras e validações que rodam quando o campo perde o foco. Após atualizar a extensão, recarregue a página de teste para que o content script seja atualizado; em abas já abertas, a extensão tenta uma injeção alternativa automaticamente.

Os valores gerados são sintéticos e devem ser usados somente em ambientes de desenvolvimento e teste. A extensão não usa backend nem chamadas de rede.
