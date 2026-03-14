## Why

O hook `useCategories` substitui toda a lista de categorias quando o `onSnapshot` do Firestore retorna documentos. Como as `DEFAULT_CATEGORIES` nunca são gravadas no Firestore, elas desaparecem assim que qualquer categoria custom é criada ou quando se troca de conta. Além disso, `deleteCategory` não impede a exclusão de categorias padrão.

## What Changes

- Merge de `DEFAULT_CATEGORIES` com categorias do Firestore no handler do `onSnapshot` (snap não-vazio), garantindo que defaults estejam sempre presentes.
- Guard no `deleteCategory` para impedir exclusão de categorias default.
- Tratamento na troca de `accountType`: garantir que o estado de categorias sempre inclui defaults ao reiniciar o listener.

## Capabilities

### New Capabilities

- `category-defaults-protection`: Garante que categorias padrão estejam sempre presentes e não possam ser deletadas pelo usuário.

### Modified Capabilities

## Impact

- `src/hooks/useCategories.tsx` — alteração no `onSnapshot` handler e em `deleteCategory`.
- `src/lib/categories.ts` — nenhuma alteração (apenas leitura de `DEFAULT_CATEGORIES`).
- Componentes que consomem `useCategories()` não são afetados (interface do hook permanece a mesma).
