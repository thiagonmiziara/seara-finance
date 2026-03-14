## 1. Fix onSnapshot merge

- [x] 1.1 No handler de snapshot não-vazio em `useCategories.tsx`, fazer merge de `DEFAULT_CATEGORIES` com `cats` do Firestore via `Map<value, Category>` (defaults primeiro, Firestore sobrescreve conflitos) antes de chamar `setCategories`.
- [x] 1.2 Garantir que a mesma lógica de merge se aplica ao branch de snapshot vazio (preservar defaults + categorias custom locais).

## 2. Proteger categorias default contra exclusão

- [x] 2.1 Adicionar guard no início de `deleteCategory`: se `DEFAULT_CATEGORIES.some(d => d.value === value)`, retornar imediatamente sem ação.

## 3. Testes

- [x] 3.1 Atualizar/criar testes em `useCategories.test.tsx` para verificar que defaults permanecem após snapshot não-vazio.
- [x] 3.2 Adicionar teste que verifica que `deleteCategory` não remove categorias default.
- [x] 3.3 Adicionar teste que verifica merge correto ao trocar de `accountType`.
