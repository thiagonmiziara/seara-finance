## Why

Os cartões de crédito cadastrados no app não exibem a bandeira (Visa, Mastercard, Elo, etc.) nem têm um visual imersivo — são apenas itens de lista com uma cor de identificação. Isso prejudica a experiência do usuário, que não consegue identificar rapidamente seus cartões da mesma forma que em apps financeiros modernos.

## What Changes

- Adicionar campos opcionais `brand` e `lastFour` ao tipo `CreditCard`
- Adicionar campo "Últimos 4 dígitos" e seletor de bandeira (dropdown com ícone) no `AddCardModal`
- Adicionar campo de edição de bandeira/últimos 4 dígitos no `EditCardLimitModal` (renomear para `EditCardModal`)
- Redesenhar o card em `CardsView` para formato visual "cartão real" (inspirado em cartões físicos)
- Adicionar SVGs das bandeiras em `src/assets/card-brands/` (Visa, Mastercard, Elo, Amex, Hipercard, Diners Club, Discover)
- Exibir ícone da bandeira nos `SelectItem` de cartões no `AddTransactionModal`
- Cartões existentes sem bandeira continuam funcionando normalmente (compatibilidade retroativa total)

## Capabilities

### New Capabilities

- `card-brand-detection`: Seleção de bandeira de cartão via dropdown com ícone SVG local, associada aos últimos 4 dígitos; campos opcionais para compatibilidade com cartões já cadastrados
- `card-visual-redesign`: Redesign do componente de exibição de cartão para formato "cartão real" exibindo bandeira, últimos 4 dígitos mascarados, nome, dias de fechamento/vencimento e barra de limite

### Modified Capabilities

<!-- Nenhuma spec existente a modificar -->

## Impact

- **`src/types.ts`**: Adicionar `brand` e `lastFour` (opcionais) ao `creditCardSchema` e `creditCardFormSchema`
- **`src/components/AddCardModal.tsx`**: Novo campo de últimos 4 dígitos e dropdown de bandeira
- **`src/components/EditCardLimitModal.tsx`**: Renomear para `EditCardModal`, adicionar edição de bandeira e últimos 4 dígitos
- **`src/components/CardsView.tsx`**: Redesign completo do card para formato visual de cartão físico
- **`src/components/AddTransactionModal.tsx`**: Exibir ícone da bandeira no seletor de cartão
- **`src/assets/card-brands/`**: 7 arquivos SVG novos (visa, mastercard, elo, amex, hipercard, diners, discover)
- **Firestore**: Campos novos são opcionais — sem migração de dados necessária
- **Dependências**: Nenhuma nova dependência externa (SVGs locais)
