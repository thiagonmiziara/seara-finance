## Context

O hook `useCategories` (em `src/hooks/useCategories.tsx`) gerencia categorias via `onSnapshot` do Firestore + `DEFAULT_CATEGORIES` estáticas definidas em `src/lib/categories.ts`. As defaults nunca são persistidas no Firestore — existem apenas no código. O snapshot listener, ao receber documentos, substitui todo o estado com apenas o que veio do Firestore, eliminando as defaults.

O estado também é compartilhado entre contas (`personal`/`business`) via `accountType` no array de dependências do `useEffect`. Ao trocar de conta, o listener reinicia e o mesmo bug de substituição ocorre.

## Goals / Non-Goals

**Goals:**

- Categorias padrão (`DEFAULT_CATEGORIES`) SEMPRE presentes no estado, independentemente do conteúdo do Firestore.
- Impedir exclusão de categorias padrão via `deleteCategory`.
- Merge correto ao trocar de `accountType` (defaults + custom da nova conta).

**Non-Goals:**

- Persistir defaults no Firestore (continuam sendo apenas código).
- Alterar a interface pública do hook (`categories`, `addCategory`, `deleteCategory`).
- Adicionar/remover categorias default da lista em `categories.ts`.

## Decisions

### 1. Merge por Map no onSnapshot handler

No callback de snapshot não-vazio, fazer merge via `Map<value, Category>` — defaults primeiro, depois Firestore sobrescreve conflitos. Isso garante que defaults estão sempre presentes e que customizações do Firestore com mesmo `value` prevalecem.

**Alternativa considerada**: Persistir defaults no Firestore ao criar conta. Rejeitado porque adiciona escrita desnecessária, complica migração de defaults existentes, e cria divergência se a lista de defaults mudar no código.

### 2. Guard no deleteCategory

Adicionar verificação no início de `deleteCategory`: se o `value` pertence a `DEFAULT_CATEGORIES`, retornar imediatamente sem ação.

**Alternativa considerada**: Filtrar no UI (desabilitar botão de deletar para defaults). Seria insuficiente sozinho — a proteção deve estar no nível do hook para segurança.

## Risks / Trade-offs

- [Colisão de `value`] Se um usuário criar uma categoria com o mesmo `value` de uma default (ex: "salario"), a versão Firestore sobrescreverá a default no merge. → Aceitável: o `addCategory` já gera slugs únicos com sufixo numérico.
- [Ordenação] O merge via Map não preserva a ordem `orderBy('label')` do Firestore para defaults que não estão no Firestore. → Mitigação: após merge, ordenar por label ou manter defaults no início.
