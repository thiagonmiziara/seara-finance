## ADDED Requirements

### Requirement: Exibir ícone SVG da bandeira do cartão
O sistema SHALL exibir o ícone SVG da bandeira em todos os locais onde o cartão é representado visualmente. Quando `brand` for `undefined`, o sistema SHALL exibir um ícone genérico de cartão (Lucide `CreditCard`).

Locais de exibição:
- Card visual em `CardsView`
- `SelectItem` no seletor de cartão em `AddTransactionModal`

#### Scenario: Cartão com bandeira conhecida exibido
- **WHEN** o sistema renderiza um cartão com `brand = "visa"`
- **THEN** o sistema SHALL exibir o SVG `visa.svg` no local de exibição

#### Scenario: Cartão sem bandeira exibido
- **WHEN** o sistema renderiza um cartão com `brand = undefined`
- **THEN** o sistema SHALL exibir o ícone genérico `CreditCard` da Lucide no lugar do SVG de bandeira

#### Scenario: SVGs locais carregados como assets estáticos
- **WHEN** o sistema é compilado (build)
- **THEN** os SVGs de bandeiras em `src/assets/card-brands/` SHALL ser incluídos nos assets do build via import com `?url`

### Requirement: Exibir card no formato "cartão físico"
O sistema SHALL redesenhar o componente de exibição de cartão em `CardsView` para um layout visual que remete a um cartão de crédito físico, contendo: faixa colorida superior, ícone da bandeira, número mascarado com últimos 4 dígitos visíveis, nome do cartão, dias de fechamento e vencimento, e barra de limite.

#### Scenario: Card renderizado com todos os dados
- **WHEN** o sistema exibe um cartão com `brand`, `lastFour`, `name`, `closingDay`, `dueDay` e `limit`
- **THEN** o sistema SHALL renderizar o card com: ícone da bandeira no topo esquerdo, `•••• •••• •••• {lastFour}` no centro, nome em destaque, e barra de progresso de uso de limite

#### Scenario: Card renderizado sem lastFour
- **WHEN** o sistema exibe um cartão com `lastFour = undefined`
- **THEN** o sistema SHALL renderizar o número mascarado como `•••• •••• •••• ••••`

#### Scenario: Faixa colorida mantida no redesign
- **WHEN** o sistema exibe um cartão no novo layout
- **THEN** o sistema SHALL manter a faixa colorida superior em `card.color` como identificador visual

### Requirement: Exibir ícone de bandeira no seletor de cartão de transações
O sistema SHALL exibir o ícone SVG da bandeira (ou ícone genérico para `undefined`) ao lado do nome do cartão no `SelectItem` dentro do `AddTransactionModal`.

#### Scenario: Seletor mostra ícone de bandeira
- **WHEN** o usuário abre o dropdown de forma de pagamento em `AddTransactionModal`
- **THEN** o sistema SHALL exibir o ícone SVG da bandeira ao lado do nome de cada cartão que possui `brand` definida
