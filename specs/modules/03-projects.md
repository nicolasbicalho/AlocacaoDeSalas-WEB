# Módulo 3 — Gerenciamento de Projetos

**Status:** `draft`
**Depende de:** Módulo 1 (Auth), Módulo 2 (Departments)
**API correspondente:** `AlocacaoDeSalas-API/specs/modules/03-projects.md` (a ser criado)

---

## Visão Geral

Um **Projeto** representa um ciclo de alocação correspondente a um semestre ou período letivo. É o ponto central da aplicação — todos os dados importados (prédios, salas, turmas) e as alocações geradas pertencem a um projeto específico.

O coordinator cria e opera projetos. O professor e o admin visualizam. Apenas um projeto pode estar com status `active` por departamento.

---

## Estrutura do Módulo

```
modules/project/
├── views/
│   ├── ProjectListView.vue
│   ├── ProjectCreateView.vue
│   └── ProjectDetailView.vue
├── components/
│   ├── ProjectCard.vue
│   ├── ProjectForm.vue
│   └── ProjectStatusBadge.vue
├── services/
│   └── project.service.ts
├── stores/
│   └── project.store.ts      # Mantém o projeto ativo selecionado
└── index.ts
```

---

## Modelo de Dados (esperado da API)

```typescript
type ProjectStatus = 'draft' | 'active' | 'closed'

interface IProject {
  id: string
  name: string          // ex: "2025/2"
  semester: string      // ex: "2025.2"
  departmentId: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects` | `ProjectListView` | `admin`, `coordinator`, `professor` |
| `/projects/new` | `ProjectCreateView` | `coordinator` |
| `/projects/:id` | `ProjectDetailView` | `admin`, `coordinator`, `professor` |

---

## 3.1 Listagem de Projetos (`ProjectListView`)

### Layout

- Título "Projetos" com botão "Novo projeto" no canto direito (visível para `coordinator`)
- Filtro de status: todos | rascunho | ativo | encerrado
- Cards de projeto (`ProjectCard`) em grid
- Estado vazio com `AppEmptyState`

### `ProjectCard`

Exibe: nome do projeto, semestre, status (`ProjectStatusBadge`), data de criação, botão "Abrir".

### Comportamento

1. Ao montar, busca projetos via `GET /projects`
2. Coordinator vê apenas projetos do seu departamento
3. Admin vê todos os projetos
4. Filtro de status não recarrega a página — filtra localmente se lista for pequena, ou via query param se paginado
5. "Abrir" navega para `/projects/:id`

### Chamada à API

```
GET /projects?status=...&page=1&limit=20
```

---

## 3.2 Criação de Projeto (`ProjectCreateView`)

### Layout

- Breadcrumb: "Projetos / Novo projeto"
- Formulário com `ProjectForm`
- Botões "Cancelar" e "Criar projeto"

### Campos do formulário

| Campo | Tipo | Validação |
|-------|------|-----------|
| `name` | text | obrigatório, mín. 3 caracteres (ex: "2025/2") |
| `semester` | text | obrigatório, formato `YYYY.N` (ex: "2025.2") |

### Comportamento

1. Sucesso: redireciona para `/projects/:id` do projeto criado
2. Erro de duplicidade de semestre: exibe erro inline no campo `semester`

### Chamada à API

```
POST /projects
Body: { name, semester }
```

---

## 3.3 Detalhe do Projeto (`ProjectDetailView`)

### Layout

- Header com nome do projeto, `ProjectStatusBadge` e menu de ações
- Tabs de navegação: "Visão Geral" | "Dados" | "Alocação" | "Relatórios"
- Cada tab corresponde a uma sub-seção ou redireciona para a view específica

### Ações disponíveis por status

| Ação | Status requerido | Role |
|------|-----------------|------|
| Ativar projeto | `draft` | `coordinator` |
| Encerrar projeto | `active` | `coordinator` |
| Importar dados | `draft` ou `active` | `coordinator` |
| Executar alocação | `active` | `coordinator` |
| Ver relatórios | qualquer | todos |

### Comportamento

1. Ao montar, carrega o projeto e armazena em `projectStore.currentProject`
2. "Ativar projeto": abre confirmação; chama `PATCH /projects/:id/activate`
3. "Encerrar projeto": abre confirmação com variante `warning`; chama `PATCH /projects/:id/close`

### Chamadas à API

```
GET /projects/:id
PATCH /projects/:id/activate
PATCH /projects/:id/close
```

---

## Critérios de Aceitação

- [ ] Coordinator vê apenas projetos do seu departamento
- [ ] Admin vê todos os projetos
- [ ] Professor visualiza projetos mas não pode criar ou ativar
- [ ] Projeto criado começa com status `draft`
- [ ] Projeto ativado exibe badge "Ativo"
- [ ] Projeto encerrado não pode mais ser editado
