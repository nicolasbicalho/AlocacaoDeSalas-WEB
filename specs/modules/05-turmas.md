# Módulo 5 — Gerenciamento de Turmas

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth), Módulo 2 (Institutes), Módulo 3 (Projects)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/05-turmas.md`](../../../AlocacaoDeSalas-API/specs/modules/05-turmas.md)

---

## Visão Geral

Telas para o `user` cadastrar as **turmas** de um projeto — o insumo que, junto com as salas, alimenta a alocação automática. Cada turma tem tamanho, professor, **requisitos** (características que a sala precisa ter) e uma **grade de horários semanais**. `admin` visualiza (somente leitura).

Turmas são acessadas **a partir do projeto** (rota aninhada por `projectId`).

---

## Estrutura do Módulo

```
modules/turma/
├── views/        # TurmaListView, TurmaCreateView, TurmaDetailView
├── components/   # TurmaForm, ScheduleEditor, RequiredAttributesEditor
├── services/turma.service.ts
└── index.ts
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:projectId/turmas` | `TurmaListView` | `admin`, `user` |
| `/projects/:projectId/turmas/new` | `TurmaCreateView` | `user` |
| `/turmas/:id` | `TurmaDetailView` | `admin`, `user` |

---

## 5.1 Lista (por projeto)
Tabela: Nome, Código, Nº alunos, Professor, Nº horários, Status, Ações (Ver). Botão "Nova turma" (`user`). Breadcrumb: Projetos / {projeto} / Turmas.

## 5.2 Form (`TurmaForm`)
- Campos: nome, código (opcional), nº de alunos, professor.
- **`RequiredAttributesEditor`**: lista de chaves de característica exigidas (ex.: `projector`, `accessible`) — entrada por tags/lista; idealmente sugere chaves já usadas nas salas do instituto.
- **`ScheduleEditor`**: linhas dinâmicas de horário — seletor de dia (Seg–Sáb) + hora início + hora fim; adicionar/remover; valida `fim > início`.
- Erros inline: `TURMA_CODE_EXISTS` → campo código.

## 5.3 Detalhe (`TurmaDetailView`)
`TurmaForm` em edição (`user`) ou somente leitura (`admin`); desativar (`user`, com `AppConfirmDialog`). Breadcrumb volta para as turmas do projeto.

### `ScheduleEditor`
Cada linha = `{ day, start, end }`. `day`: select Seg/Ter/Qua/Qui/Sex/Sáb (mapeando para `mon`..`sat`). `start`/`end`: inputs `time` (`HH:MM`). Emite a lista para o `TurmaForm`.

### `RequiredAttributesEditor`
Lista de chaves (strings) que a sala deve ter. Entrada simples (campo + adicionar, chips removíveis). Chaves únicas.

---

## Critérios de Aceitação
- [x] `user` cria/edita/desativa turmas de um projeto do seu instituto
- [x] Editor de horários permite N faixas por semana com validação de `fim > início`
- [x] Editor de requisitos permite N chaves de característica
- [x] `admin` vê em somente leitura
- [x] Código duplicado no projeto exibe erro inline
- [x] Turmas são acessadas a partir do projeto (rota aninhada)
