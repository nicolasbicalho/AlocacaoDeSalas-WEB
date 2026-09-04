# Módulo 2 — Gerenciamento de Departamentos

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/02-departments.md`](../../../AlocacaoDeSalas-API/specs/modules/02-departments.md)

---

## Visão Geral

Permite ao `admin` criar, listar, visualizar, editar e desativar departamentos. Departamentos são pré-requisito para criar coordenadores e para a estrutura física (prédios e salas).

---

## Estrutura do Módulo

```
modules/department/
├── views/
│   ├── DepartmentListView.vue
│   ├── DepartmentCreateView.vue
│   └── DepartmentDetailView.vue
├── components/
│   ├── DepartmentCard.vue
│   ├── DepartmentForm.vue
│   └── DepartmentStatusBadge.vue
├── services/
│   └── department.service.ts
└── index.ts
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/departments` | `DepartmentListView` | `admin` |
| `/departments/new` | `DepartmentCreateView` | `admin` |
| `/departments/:id` | `DepartmentDetailView` | `admin`, `coordinator` |

---

## 2.1 Listagem de Departamentos (`DepartmentListView`)

### Layout

- Título "Departamentos" com botão "Novo departamento" no canto direito (visível apenas para `admin`)
- Campo de busca textual (por nome ou código)
- Tabela com colunas: Nome, Código, Status, Ações
- Paginação na parte inferior
- Estado vazio com `AppEmptyState` quando não há registros

### Colunas da tabela

| Coluna | Descrição |
|--------|-----------|
| Nome | Nome do departamento |
| Código | Código em uppercase |
| Status | `AppBadge` — `success` se ativo, `neutral` se inativo |
| Ações | Botão "Ver" → navega para `/departments/:id` |

### Comportamento

1. Ao montar, busca a lista paginada via `GET /departments`
2. Busca textual com debounce de 300ms atualiza a listagem
3. Paginação via `AppPagination` — troca de página refaz a busca
4. Exibe skeleton loader (`AppTable` com `loading: true`) durante carregamento

### Chamadas à API

```
GET /departments?page=1&limit=20&search=...
```

---

## 2.2 Criação de Departamento (`DepartmentCreateView`)

### Layout

- Breadcrumb: "Departamentos / Novo departamento"
- Formulário centralizado com `DepartmentForm`
- Botões "Cancelar" (navega para `/departments`) e "Salvar"

### Campos do formulário (`DepartmentForm`)

| Campo | Tipo | Validação |
|-------|------|-----------|
| `name` | text | obrigatório, mín. 2 caracteres |
| `code` | text | obrigatório, mín. 2, máx. 10 caracteres, uppercase automático |

### Comportamento

1. Usuário preenche nome e código e clica em "Salvar"
2. Exibe loading no botão durante a requisição
3. Sucesso: exibe toast "Departamento criado com sucesso" e redireciona para `/departments`
4. Erro `DEPARTMENT_NAME_EXISTS`: exibe erro inline no campo `name`
5. Erro `DEPARTMENT_CODE_EXISTS`: exibe erro inline no campo `code`
6. Erro de validação: erros inline nos campos correspondentes

### Chamada à API

```
POST /departments
Body: { name, code }
```

---

## 2.3 Detalhe / Edição de Departamento (`DepartmentDetailView`)

### Layout

- Breadcrumb: "Departamentos / {nome}"
- Seção de informações com `DepartmentForm` em modo edição
- Botão "Salvar alterações" (apenas `admin`)
- Seção de perigo: botão "Desativar departamento" (apenas `admin`, visível somente se `active: true`)
- Coordinator vê apenas dados em somente leitura

### Comportamento

1. Ao montar, busca o departamento via `GET /departments/:id`
2. Admin pode editar nome e código — validações iguais à criação
3. Salvar: chama `PUT /departments/:id`, exibe toast de sucesso
4. Desativar: abre `AppConfirmDialog` com variante `danger`; ao confirmar, chama `PATCH /departments/:id/deactivate`; após sucesso, exibe toast "Departamento desativado" e redireciona para `/departments`
5. Coordinator: vê dados em modo somente leitura, sem botões de edição

### Chamadas à API

```
GET /departments/:id
PUT /departments/:id       Body: { name?, code? }
PATCH /departments/:id/deactivate
```

---

## Critérios de Aceitação

- [x] Admin consegue criar departamento com nome e código únicos
- [x] Nome duplicado exibe erro inline no campo correto
- [x] Código duplicado exibe erro inline no campo correto
- [x] Listagem exibe paginação corretamente
- [x] Busca textual com debounce filtra a listagem
- [x] Coordinator vê a view de detalhe em somente leitura
- [x] Desativação abre diálogo de confirmação antes de executar
- [x] Departamento desativado exibe badge "Inativo" na listagem
