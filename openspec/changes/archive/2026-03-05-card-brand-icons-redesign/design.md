## Context

Atualmente, os cartões de crédito no seara-finance são identificados apenas por nome e cor. O tipo `CreditCard` no schema Zod não armazena bandeira nem número, e o visual em `CardsView` é um card genérico. A identificação visual é limitada a um ícone estático da Lucide (`CreditCard`) colorido com `card.color`. Não há como distinguir visualmente um Visa de um Mastercard.

A feature deve ser opcional e retrocompatível — os ~N cartões já cadastrados no Firestore não possuem esses campos, e isso não deve ser tratado como erro.

## Goals / Non-Goals

**Goals:**
- Permitir associar bandeira e últimos 4 dígitos a um cartão (opcionalmente)
- Exibir ícones SVG locais das bandeiras onde o cartão é exibido
- Redesenhar o card em `CardsView` para formato visual "cartão físico"
- Compatibilidade total com cartões já cadastrados (sem migração de dados)

**Non-Goals:**
- Armazenar o número completo do cartão (segurança)
- Detecção automática de bandeira por número (usuário escolhe manualmente)
- Validação de número de cartão (Luhn algorithm)
- Integração com APIs externas de bandeiras
- Suporte a cartões de débito (escopo apenas crédito)

## Decisions

### D1: Campos opcionais no schema

`brand` e `lastFour` são adicionados como `z.string().optional()` ao `creditCardSchema`.

**Alternativa considerada:** Campos obrigatórios com valor default `"unknown"/""`  
**Motivo da escolha:** Opcional é semanticamente correto — um cartão sem bandeira informada é diferente de um com bandeira desconhecida. Evita poluição de dados no Firestore.

### D2: Seleção manual de bandeira (não auto-detect)

O usuário escolhe a bandeira via dropdown. Os últimos 4 dígitos são digitados manualmente em um campo separado.

**Alternativa considerada:** Campo número completo com detecção automática  
**Motivo da escolha:** Escolha do usuário durante explore. Mais simples, sem dados sensíveis transitando ou sendo armazenados.

### D3: SVGs locais em `src/assets/card-brands/`

Ícones como módulos importados no build (Vite trata SVGs como assets estáticos com `?url`).

**Alternativa considerada:** Biblioteca como `react-payment-icons`  
**Motivo da escolha:** Escolha do usuário. Sem dependência externa, controle total sobre os assets.

**Convenção de nomes:** `visa.svg`, `mastercard.svg`, `elo.svg`, `amex.svg`, `hipercard.svg`, `diners.svg`, `discover.svg`  
**Fonte:** SVGs de domínio público / licença permissiva (simpleicons.org ou similar)

### D4: Componente utilitário `CardBrandIcon`

Um componente `CardBrandIcon` centraliza o mapeamento `brand → SVG` e o fallback para cartões sem bandeira.

```
brand = "visa"     → <img src={visaSvg} alt="Visa" />
brand = undefined  → <CreditCard /> (ícone Lucide genérico)
```

### D5: Redesign do card como "cartão físico"

O card em `CardsView` é redesenhado para incluir layout visual de cartão — bandeira no topo esquerdo, últimos 4 dígitos mascarados no centro, nome e dias no rodapé interno.  

**Alternativa considerada:** Manter layout atual, apenas adicionar ícone de bandeira  
**Motivo da escolha:** Escolha do usuário durante explore. Mais imersivo e consistente com apps financeiros modernos.

### D6: Atualizar `EditCardLimitModal` → campos de bandeira/dígitos editáveis

O modal de edição existente já cobre `limit`. Adicionar `brand` e `lastFour` ao mesmo modal evita proliferação de modais.  

## Risks / Trade-offs

- **[Risk] SVGs não disponíveis para todas as bandeiras** → Fallback para ícone genérico `CreditCard` da Lucide garante que nunca quebra
- **[Risk] Campo `lastFour` aceita qualquer string de 4 chars** → Validação simples com `z.string().length(4).regex(/^\d{4}$/).optional()` no schema
- **[Risk] Cartões existentes sem `brand`/`lastFour` renderizam de forma estranha no novo card visual** → Tratar `undefined` explicitamente: exibir `•••• •••• •••• ••••` quando `lastFour` ausente, sem ícone quando `brand` ausente

## Migration Plan

- Nenhuma migração de dados necessária — campos opcionais no Firestore
- Deploy direto — sem breaking changes para dados existentes
- Rollback: reverter os componentes UI; dados novos no Firestore são ignorados pela versão anterior (campos extras são ignorados pelo Zod com `.passthrough()` ou simplesmente não lidos)
