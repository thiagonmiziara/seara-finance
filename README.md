# Seara Finance

<p align="center">
  <img src="public/logo.png" alt="Seara Finance" width="120" />
</p>

Uma aplicação web de gerenciamento financeiro pessoal construída com React, TypeScript, Vite e Firebase. Permite controlar transações, cartões de crédito, dívidas parceladas e visualizar previsões de faturas e relatórios. O projeto foca em UX simples, sincronização em tempo real via Firestore e um design escuro moderno.

---

## ✨ Principais funcionalidades

- Controle de transações (entradas/saídas)
- Registro e gerenciamento de cartões de crédito
- Controle de dívidas parceladas com pagamento de parcelas
- Visualização de previsão de fatura por cartão
- Limite disponível do cartão calculado em função de dívidas/transações pendentes
- Sincronização em tempo real usando Firestore (`onSnapshot`) — ações em uma aba refletem imediatamente em outras
- Indicadores visuais para parcelas pagas (riscado + ícone verde) e próxima parcela a pagar

---

## Tecnologias

- React + TypeScript
- Vite
- Tailwind CSS
- Radix UI (componentes acessíveis)
- Firebase Firestore (persistência e sincronização em tempo real)
- React Hook Form + Zod (validação de formulários)
- TanStack Query (caching e sincronização)
- Vitest (testes)

---

## Visual

Desktop preview:

![Desktop preview](public/logo.png)

Mobile preview:

![Mobile preview](public/pwa-192x192.png)

---

## Rápido começo (Desenvolvimento)

1. Instale dependências:

```bash
npm install
```

2. Crie ou configure as variáveis de ambiente do Firebase (arquivo `.env` na raiz):

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Rodar em modo de desenvolvimento:

```bash
npm run dev
# Acesse http://localhost:5173 (ou a porta exibida)
```

4. Build para produção:

```bash
npm run build
npm run preview
```

---

## Scripts úteis

- `npm run dev` — inicia o servidor Vite em modo desenvolvimento
- `npm run build` — gera build de produção
- `npm run preview` — serve a build gerada localmente
- `npm test` — roda testes com Vitest (se aplicável)

---

## Arquitetura e ponto de atenção

- Hooks centrais:
  - `useDebts` — gerencia dívidas, atualiza Firestore e expõe `incrementInstallment` / `settleDebt`.
  - `useCards` — escuta `cards` e fornece operações sobre cartões.
  - `useFinance` — provê `transactions` usadas para previsões de fatura.

- Sincronização: alterações em `useDebts` são persistidas no Firestore e propagadas por `onSnapshot`, garantindo paridade entre abas (ex.: pagar parcela no card atualiza a aba Dívidas).

- Cálculo de limite: o componente `CardsView` tem lógica para evitar dupla contagem entre transações pendentes e dívidas vinculadas ao mesmo cartão. Caso exista dívida vinculada, o limite usado é calculado a partir do restante das dívidas; caso contrário, usa as transações pendentes.

---

## Boas práticas ao desenvolver

- Use `forwardRef` em componentes que irão receber refs (ex.: inputs usados com React Hook Form/Radix)
- Valide formatos de data como `YYYY-MM-DD` para consistência entre navegadores/mobile
- Prefira `Controller` do React Hook Form para campos nativos que possam ter comportamento diferente em dispositivos móveis (ex.: `type="date"`)

---

## Contribuições

Contribuições são bem-vindas. Abra uma issue descrevendo o que deseja implementar ou melhore o código via pull request.

---

## Contato

Projeto mantido por Thiago Miziara. Para dúvidas ou sugestões, abra uma issue no repositório.

---

Licença: MIT (adicione arquivo LICENSE se desejar)
