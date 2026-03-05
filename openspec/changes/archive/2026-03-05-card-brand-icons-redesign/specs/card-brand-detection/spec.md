## ADDED Requirements

### Requirement: Armazenar bandeira e últimos 4 dígitos no cartão
O sistema SHALL suportar os campos opcionais `brand` (enum de bandeiras conhecidas) e `lastFour` (string de 4 dígitos numéricos) no tipo `CreditCard`. Ambos os campos SHALL ser opcionais para manter compatibilidade com cartões já cadastrados.

Bandeiras suportadas: `visa`, `mastercard`, `elo`, `amex`, `hipercard`, `diners`, `discover`.

#### Scenario: Cartão cadastrado com bandeira e últimos 4 dígitos
- **WHEN** o usuário salva um cartão com `brand = "visa"` e `lastFour = "1234"`
- **THEN** o sistema SHALL persistir esses valores no Firestore associados ao cartão

#### Scenario: Cartão cadastrado sem bandeira
- **WHEN** o usuário salva um cartão sem preencher o campo de bandeira
- **THEN** o sistema SHALL salvar o cartão normalmente com `brand` e `lastFour` ausentes

#### Scenario: Cartão existente sem bandeira carregado
- **WHEN** o sistema carrega um cartão do Firestore que não possui os campos `brand` e `lastFour`
- **THEN** o sistema SHALL tratar ambos como `undefined` sem erros de validação

### Requirement: Selecionar bandeira e informar últimos 4 dígitos no cadastro
O sistema SHALL exibir um dropdown de bandeiras com ícone SVG e um campo de texto para os últimos 4 dígitos no formulário de cadastro de cartão (`AddCardModal`). Ambos os campos SHALL ser opcionais.

#### Scenario: Usuário seleciona bandeira no dropdown
- **WHEN** o usuário abre o dropdown de bandeiras
- **THEN** o sistema SHALL exibir todas as bandeiras suportadas, cada uma com seu ícone SVG e nome

#### Scenario: Ícone de bandeira exibido após seleção
- **WHEN** o usuário seleciona uma bandeira no dropdown
- **THEN** o sistema SHALL exibir o ícone SVG da bandeira selecionada ao lado do dropdown em tempo real

#### Scenario: Campo de últimos 4 dígitos aceita apenas números
- **WHEN** o usuário digita no campo "Últimos 4 dígitos"
- **THEN** o sistema SHALL aceitar apenas 4 caracteres numéricos (`0-9`)

### Requirement: Editar bandeira e últimos 4 dígitos em cartão existente
O sistema SHALL permitir que o usuário edite `brand` e `lastFour` de um cartão já cadastrado pelo modal de edição.

#### Scenario: Usuário edita bandeira de cartão existente sem bandeira
- **WHEN** o usuário abre o modal de edição de um cartão sem bandeira e seleciona uma bandeira
- **THEN** o sistema SHALL persistir a bandeira selecionada no Firestore ao salvar
