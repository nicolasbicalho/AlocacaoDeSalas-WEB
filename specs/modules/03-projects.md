# Módulo 3 — Gerenciamento de Projetos

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth), Módulo 2 (Institutes)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/03-projects.md`](../../../AlocacaoDeSalas-API/specs/modules/03-projects.md)

---

## Visão Geral

Um **Projeto** representa um ciclo de alocação correspondente a um semestre ou período letivo. É o ponto central da aplicação — todos os dados importados (prédios, salas, turmas) e as alocações geradas pertencem a um projeto específico.

O `user` cria e opera projetos. O `admin` visualiza (leitura). Apenas um projeto pode estar com status `active` por instituto.

Cada projeto tem as **datas reais do semestre** (início e término), que delimitam o calendário do cronograma ([Módulo 6](./06-manual-allocation.md)).

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
  instituteId: string
  status: ProjectStatus
  startDate: string     // 'YYYY-MM-DD' — início do semestre
  endDate: string       // 'YYYY-MM-DD' — término do semestre
  createdAt: string
  updatedAt: string
}
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects` | `ProjectListView` | `admin`, `user` |
| `/projects/new` | `ProjectCreateView` | `user` |
| `/projects/:id` | `ProjectDetailView` | `admin`, `user` |

---

## 3.1 Listagem de Projetos (`ProjectListView`)

### Layout

- Título "Projetos" com botão "Novo projeto" no canto direito (visível para `user`)
- Filtro de status: todos | rascunho | ativo | encerrado
- Cards de projeto (`ProjectCard`) em grid
- Estado vazio com `AppEmptyState`

### `ProjectCard`

Exibe: nome do projeto, semestre, **período** (data de início – data de término), status (`ProjectStatusBadge`), data de criação, botão "Abrir".

### Comportamento

1. Ao montar, busca projetos via `GET /projects`
2. `user` vê apenas projetos do seu instituto
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
| `startDate` ("Data de início") | date | obrigatório |
| `endDate` ("Data de término") | date | obrigatório, posterior à data de início, período de até 366 dias |

### Comportamento

1. Sucesso: redireciona para `/projects/:id` do projeto criado
2. Erro `PROJECT_SEMESTER_EXISTS`: exibe erro inline no campo `semester`
3. Erro de validação das datas (`VALIDATION_ERROR`): exibe erro inline no campo de data

### Chamada à API

```
POST /projects
Body: { name, semester, startDate, endDate }
```

---

## 3.3 Detalhe do Projeto (`ProjectDetailView`)

### Layout

- Header com nome do projeto, `ProjectStatusBadge`, **período do semestre** e menu de ações
- Tabs de navegação: "Visão Geral" | "Dados" | "Alocação" | "Relatórios"
- Cada tab corresponde a uma sub-seção ou redireciona para a view específica
- Edição (`user`, projeto não encerrado): `ProjectForm` com os mesmos campos da criação, incluindo "Data de início" e "Data de término"

### Ações disponíveis por status

| Ação | Status requerido | Role |
|------|-----------------|------|
| Ativar projeto | `draft` | `user` |
| Encerrar projeto | `active` | `user` |
| Importar dados | `draft` ou `active` | `user` |
| Executar alocação | `active` | `user` |
| Ver relatórios | qualquer | todos |

### Comportamento

1. Ao montar, carrega o projeto e armazena em `projectStore.currentProject`
2. "Ativar projeto": abre confirmação; chama `PATCH /projects/:id/activate`
3. "Encerrar projeto": abre confirmação com variante `warning`; chama `PATCH /projects/:id/close`
4. Salvar edição: chama `PUT /projects/:id`; erro `PROJECT_DATES_CONFLICT` (há evento único fora do novo período) é exibido ao usuário e o projeto não é alterado

### Chamadas à API

```
GET /projects/:id
PUT /projects/:id            Body: { name?, semester?, startDate?, endDate? }
PATCH /projects/:id/activate
PATCH /projects/:id/close
```

---

## Critérios de Aceitação

- [x] `user` vê apenas projetos do seu instituto
- [x] Admin vê todos os projetos
- [x] `admin` visualiza projetos mas não cria nem ativa
- [x] Projeto criado começa com status `draft`
- [x] Projeto ativado exibe badge "Ativo"
- [x] Projeto encerrado não pode mais ser editado
- [x] Formulário de criação/edição tem "Data de início" e "Data de término" (input date), obrigatórias na criação
- [x] Card e detalhe do projeto exibem o período do semestre
- [x] `PROJECT_DATES_CONFLICT` na edição é exibido ao usuário
