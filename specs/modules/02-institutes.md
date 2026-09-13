# Módulo 2 — Gerenciamento de Institutos

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/02-institutes.md`](../../../AlocacaoDeSalas-API/specs/modules/02-institutes.md)

---

## Visão Geral

Permite ao `admin` criar, listar, visualizar, editar e desativar institutos. Institutos são a unidade organizacional gestora — donos dos prédios e pré-requisito para criar coordenadores e para a estrutura física (prédios e salas).

---

## Estrutura do Módulo

```
modules/institute/
├── views/
│   ├── InstituteListView.vue
│   ├── InstituteCreateView.vue
│   └── InstituteDetailView.vue
├── components/
│   ├── InstituteForm.vue
│   └── InstituteStatusBadge.vue
├── services/
│   └── institute.service.ts
└── index.ts
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/institutes` | `InstituteListView` | `admin` |
| `/institutes/new` | `InstituteCreateView` | `admin` |
| `/institutes/:id` | `InstituteDetailView` | `admin`, `coordinator` |

---

## 2.1 Listagem de Institutos (`InstituteListView`)

### Layout

- Título "Institutos" com botão "Novo instituto" no canto direito (visível apenas para `admin`)
- Campo de busca textual (por nome ou código)
- Tabela com colunas: Nome, Código, Status, Ações
- Paginação na parte inferior
- Estado vazio com `AppEmptyState` quando não há registros

### Colunas da tabela

| Coluna | Descrição |
|--------|-----------|
| Nome | Nome do instituto |
| Código | Código em uppercase |
| Status | `AppBadge` — `success` se ativo, `neutral` se inativo |
| Ações | Botão "Ver" → navega para `/institutes/:id` |

### Comportamento

1. Ao montar, busca a lista paginada via `GET /institutes`
2. Busca textual com debounce de 300ms atualiza a listagem
3. Paginação via `AppPagination` — troca de página refaz a busca
4. Exibe skeleton loader (`AppTable` com `loading: true`) durante carregamento

### Chamadas à API

```
GET /institutes?page=1&limit=20&search=...
```

---

## 2.2 Criação de Instituto (`InstituteCreateView`)

### Layout

- Breadcrumb: "Institutos / Novo instituto"
- Formulário centralizado com `InstituteForm`
- Botões "Cancelar" (navega para `/institutes`) e "Salvar"

### Campos do formulário (`InstituteForm`)

| Campo | Tipo | Validação |
|-------|------|-----------|
| `name` | text | obrigatório, mín. 2 caracteres |
| `code` | text | obrigatório, mín. 2, máx. 10 caracteres, uppercase automático |

### Comportamento

1. Usuário preenche nome e código e clica em "Salvar"
2. Exibe loading no botão durante a requisição
3. Sucesso: exibe toast "Instituto criado com sucesso" e redireciona para `/institutes`
4. Erro `INSTITUTE_NAME_EXISTS`: exibe erro inline no campo `name`
5. Erro `INSTITUTE_CODE_EXISTS`: exibe erro inline no campo `code`
6. Erro de validação: erros inline nos campos correspondentes

### Chamada à API

```
POST /institutes
Body: { name, code }
```

---

## 2.3 Detalhe / Edição de Instituto (`InstituteDetailView`)

### Layout

- Breadcrumb: "Institutos / {nome}"
- Seção de informações com `InstituteForm` em modo edição
- Botão "Salvar alterações" (apenas `admin`)
- Seção de perigo: botão "Desativar instituto" (apenas `admin`, visível somente se `active: true`)
- Coordinator vê apenas dados em somente leitura

### Comportamento

1. Ao montar, busca o instituto via `GET /institutes/:id`
2. Admin pode editar nome e código — validações iguais à criação
3. Salvar: chama `PUT /institutes/:id`, exibe toast de sucesso
4. Desativar: abre `AppConfirmDialog` com variante `danger`; ao confirmar, chama `PATCH /institutes/:id/deactivate`; após sucesso, exibe toast "Instituto desativado" e redireciona para `/institutes`
5. Coordinator: vê dados em modo somente leitura, sem botões de edição

### Chamadas à API

```
GET /institutes/:id
PUT /institutes/:id       Body: { name?, code? }
PATCH /institutes/:id/deactivate
```

---

## Critérios de Aceitação

- [x] Admin consegue criar instituto com nome e código únicos
- [x] Nome duplicado exibe erro inline no campo correto
- [x] Código duplicado exibe erro inline no campo correto
- [x] Listagem exibe paginação corretamente
- [x] Busca textual com debounce filtra a listagem
- [x] Coordinator vê a view de detalhe em somente leitura
- [x] Desativação abre diálogo de confirmação antes de executar
- [x] Instituto desativado exibe badge "Inativo" na listagem
