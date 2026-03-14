## ADDED Requirements

### Requirement: Default categories always present

O sistema SHALL sempre incluir `DEFAULT_CATEGORIES` no array `categories` retornado pelo hook `useCategories`, independentemente do conteúdo do snapshot do Firestore.

#### Scenario: Snapshot com categorias custom

- **WHEN** o Firestore retorna um snapshot não-vazio com categorias custom
- **THEN** o estado `categories` MUST conter todas as `DEFAULT_CATEGORIES` mais as categorias custom do snapshot

#### Scenario: Snapshot vazio

- **WHEN** o Firestore retorna um snapshot vazio
- **THEN** o estado `categories` MUST conter ao menos todas as `DEFAULT_CATEGORIES`

#### Scenario: Troca de conta

- **WHEN** o `accountType` muda de `personal` para `business` (ou vice-versa)
- **THEN** as `DEFAULT_CATEGORIES` MUST estar presentes no estado, junto com as custom da nova conta

### Requirement: Default categories cannot be deleted

O sistema SHALL impedir a exclusão de categorias que pertencem à lista `DEFAULT_CATEGORIES`.

#### Scenario: Tentativa de deletar categoria padrão

- **WHEN** `deleteCategory` é chamado com um `value` que existe em `DEFAULT_CATEGORIES`
- **THEN** a função MUST retornar sem modificar o estado ou o Firestore

#### Scenario: Deletar categoria custom

- **WHEN** `deleteCategory` é chamado com um `value` que NÃO existe em `DEFAULT_CATEGORIES`
- **THEN** a categoria MUST ser removida do Firestore (se aplicável) e do estado local
