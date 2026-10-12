# Módulo 9 — Auditoria

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/09-audit.md`](../../../AlocacaoDeSalas-API/specs/modules/09-audit.md)

> **Módulo transversal:** consulta os registros de todos os módulos. Foi implementado **antes** dos módulos 07 (Alocação Automática) e 08 (Relatórios).

---

## Visão Geral

Tela exclusiva do `admin` para consultar o **registro de auditoria**: quem fez o quê, em qual registro e quando. A API grava automaticamente toda alteração bem-sucedida (criar, editar, mover, remover, ativar, desativar, encerrar) e toda tentativa de login; o frontend apenas lista e filtra — não há criação, edição nem remoção de registros.

---

## Estrutura do Módulo

```
modules/audit/
├── views/
│   └── AuditLogView.vue        # Filtros + tabela paginada com detalhes expansíveis
├── services/
│   └── audit.service.ts        # list (GET /audit-logs)
├── labels.ts                   # rótulos em PT de entidades/ações e cor do selo por ação
└── index.ts                    # rotas do módulo
```

---

## Modelo de Dados (esperado da API)

```typescript
type AuditEntity =
  | 'auth' | 'user' | 'institute' | 'project'
  | 'building' | 'room' | 'turma' | 'allocation' | 'professor'

type AuditAction =
  | 'create' | 'update' | 'delete' | 'move'
  | 'activate' | 'deactivate' | 'close'
  | 'login' | 'login_failed' | 'logout'
  | 'forgot_password' | 'reset_password'

interface IAuditLog {
  id: string
  userId?: string
  userName?: string       // fotografia do nome no momento da ação
  userEmail?: string      // fotografia do e-mail no momento da ação
  role?: 'admin' | 'user'
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  method: string
  path: string
  statusCode: number
  details?: unknown       // campos sensíveis chegam como "[REDACTED]"
  ip?: string
  userAgent?: string
  createdAt: string
}
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/audit` | `AuditLogView` | `admin` |

Link **"Auditoria"** no menu superior do `AppLayout`, visível **somente para `admin`**.

---

## 9.1 Registros de Auditoria (`AuditLogView`)

### Layout

- Título "Auditoria"
- Filtros: **entidade** (select), **ação** (select), **período** — de / até (inputs date)
- Tabela com colunas: Data/hora, Usuário, Ação, Entidade, Registro
- Cada linha tem **detalhes expansíveis** (método, caminho, status HTTP, `details`, IP e user agent)
- Paginação na parte inferior (`AppPagination`)
- Estado vazio com `AppEmptyState` quando não há registros

### Colunas da tabela

| Coluna | Descrição |
|--------|-----------|
| Data/hora | `createdAt` formatado (mais recentes primeiro) |
| Usuário | `userName` / `userEmail` gravados no momento da ação (vazio quando não há ator, ex.: `login_failed`) |
| Ação | Rótulo em português da `action` |
| Entidade | Rótulo em português da `entity` |
| Registro | `entityId` do registro afetado, quando houver |

### Comportamento

1. Ao montar, busca a primeira página via `GET /audit-logs`
2. Alterar um filtro volta para a página 1 e refaz a busca
3. Paginação via `AppPagination` — troca de página refaz a busca
4. Exibe loading (`AppTable` com `loading: true`) durante o carregamento

### Chamada à API

```
GET /audit-logs?page=1&limit=20&entity=...&action=...&from=YYYY-MM-DD&to=YYYY-MM-DD
```

---

## Critérios de Aceitação

- [x] Rota `/audit` acessível apenas para `admin`; `user` é redirecionado pelo `roleGuard`
- [x] Link "Auditoria" no menu superior aparece só para `admin`
- [x] Filtros por entidade, ação e período (de/até) refazem a busca
- [x] Tabela exibe data/hora, usuário, ação, entidade e registro, com paginação
- [x] Cada linha expande para mostrar os detalhes do registro
- [x] Estado vazio exibido quando não há registros
- [x] Dark mode em todos os elementos do módulo
