## 1. Schema e Tipos

- [x] 1.1 Adicionar `brand` (enum opcional) ao `creditCardSchema` e `creditCardFormSchema` em `src/types.ts`
- [x] 1.2 Adicionar `lastFour` (`z.string().length(4).regex(/^\d{4}$/).optional()`) ao `creditCardSchema` e `creditCardFormSchema` em `src/types.ts`

## 2. Assets SVG das Bandeiras

- [x] 2.1 Criar pasta `src/assets/card-brands/`
- [x] 2.2 Adicionar `visa.svg` em `src/assets/card-brands/`
- [x] 2.3 Adicionar `mastercard.svg` em `src/assets/card-brands/`
- [x] 2.4 Adicionar `elo.svg` em `src/assets/card-brands/`
- [x] 2.5 Adicionar `amex.svg` em `src/assets/card-brands/`
- [x] 2.6 Adicionar `hipercard.svg` em `src/assets/card-brands/`
- [x] 2.7 Adicionar `diners.svg` em `src/assets/card-brands/`
- [x] 2.8 Adicionar `discover.svg` em `src/assets/card-brands/`

## 3. Componente CardBrandIcon

- [x] 3.1 Criar `src/components/CardBrandIcon.tsx` com mapeamento `brand → SVG` e fallback para ícone genérico `CreditCard` da Lucide

## 4. Formulário de Cadastro (AddCardModal)

- [x] 4.1 Adicionar seção "Informações do cartão (opcional)" no `AddCardModal`
- [x] 4.2 Adicionar dropdown de seleção de bandeira com ícone SVG de preview em tempo real
- [x] 4.3 Adicionar campo de input "Últimos 4 dígitos" (aceitar apenas 4 dígitos numéricos)
- [x] 4.4 Passar `brand` e `lastFour` no submit do formulário

## 5. Formulário de Edição (EditCardLimitModal)

- [x] 5.1 Adicionar campos `brand` e `lastFour` ao `EditCardLimitModal` (dropdown + input)
- [x] 5.2 Popular campos com valores existentes do cartão ao abrir o modal

## 6. Redesign do Card Visual (CardsView)

- [x] 6.1 Redesenhar o card em `CardsView` para formato "cartão físico" com faixa colorida, ícone de bandeira, número mascarado (`•••• •••• •••• {lastFour}` ou `•••• •••• •••• ••••`), nome, dias de fechamento/vencimento
- [x] 6.2 Garantir fallback visual correto para cartões sem `brand` e sem `lastFour`
- [x] 6.3 Manter barra de limite e informações de fatura no novo layout

## 7. Seletor de Cartão em Transações (AddTransactionModal)

- [x] 7.1 Substituir ícone estático `CreditCard` pelo componente `CardBrandIcon` no `SelectItem` de cartões em `AddTransactionModal`

## 8. Validação e Testes

- [x] 8.1 Verificar que cartões existentes (sem `brand`/`lastFour`) carregam sem erros
- [x] 8.2 Verificar que o formulário de cadastro funciona sem preencher bandeira/dígitos
- [x] 8.3 Verificar que o redesign do card exibe corretamente todas as variações (com bandeira, sem bandeira, com lastFour, sem lastFour)
