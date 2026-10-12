# Módulo 5 — Gerenciamento de Turmas

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth), Módulo 2 (Institutes), Módulo 3 (Projects)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/05-turmas.md`](../../../AlocacaoDeSalas-API/specs/modules/05-turmas.md)

> **Planejado — feedback do gerente (2026-10):** a aba Turmas vira a ferramenta principal do gerente — abas **Graduação / Pós / Externas**, busca por disciplina/professor/código/setor, ordem alfabética correta, **nº de alunos editável na tabela** e coluna **Sala(s)**; formulário com categoria, setor (departamento) e anotações (fase 1); seletor de professor a partir do novo cadastro de professores (fase 2); sala de prática simultânea (fase 3). Ver o [plano](../../../AlocacaoDeSalas-API/specs/plans/2026-10-plano-feedback-gerente.md).

---

## Visão Geral

Telas para o `user` cadastrar as **turmas** de um projeto — o insumo que, junto com as salas, alimenta a alocação automática. Cada turma tem tamanho, professor, **requisitos** (características que a sala precisa ter, da mesma lista fixa das salas) e uma **grade de horários semanais**. `admin` visualiza (somente leitura).

Turmas são acessadas **a partir do projeto** (rota aninhada por `projectId`).

---

## Estrutura do Módulo

```
modules/turma/
├── views/        # TurmaListView, TurmaCreateView, TurmaDetailView
├── components/   # TurmaForm, ScheduleEditor
├── services/turma.service.ts
└── index.ts
```

Os requisitos usam o componente compartilhado `FeatureCheckboxes` (`src/shared/components/`), o mesmo das salas.

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:projectId/turmas` | aba **Turmas** do `ProjectShell` (`TurmaListView`) | `admin`, `user` |
| `/projects/:projectId/turmas/new` | `TurmaCreateView` (aba Turmas) | `user` |
| `/projects/:projectId/turmas/:turmaId` | `TurmaDetailView` (aba Turmas) | `admin`, `user` |
| `/turmas/:id` | redireciona para a rota aninhada (URL antiga) | `admin`, `user` |

As telas de turma são abas do `ProjectShell` (breadcrumb `Projetos › {projeto} › Turmas › {turma}`). Criar/desativar turma volta para a aba Turmas.

---

## 5.1 Lista (por projeto)
Tabela: Nome, Código, Nº alunos, Professor, Nº horários, Status, Ações (Ver). Botão "Nova turma" (`user`). Breadcrumb: Projetos / {projeto} / Turmas.

## 5.2 Form (`TurmaForm`)
- Campos: nome, código (opcional), nº de alunos, professor.
- **Requisitos (`FeatureCheckboxes`)**: checkboxes com as 6 características fixas (`ROOM_FEATURES`); a seleção é enviada como `requiredFeatures: RoomFeature[]`. A turma só cabe em salas cujas características incluam todas as exigidas (`sala.features ⊇ turma.requiredFeatures`).
- **`ScheduleEditor`**: linhas dinâmicas de horário — seletor de dia (Seg–Sáb) + hora início + hora fim; adicionar/remover; valida `fim > início`.
- Erros inline: `TURMA_CODE_EXISTS` → campo código.

## 5.3 Detalhe (`TurmaDetailView`)
`TurmaForm` em edição (`user`) ou somente leitura (`admin`); desativar (`user`, com `AppConfirmDialog`). Breadcrumb volta para as turmas do projeto.

### `ScheduleEditor`
Cada linha = `{ day, start, end }`. `day`: select Seg/Ter/Qua/Qui/Sex/Sáb (mapeando para `mon`..`sat`). `start`/`end`: inputs `time` (`HH:MM`). Emite a lista para o `TurmaForm`.

O antigo `RequiredAttributesEditor` (chaves livres por chips) deixou de existir.

> **Migração (dev):** turmas antigas com `requiredAttributes` são convertidas para `requiredFeatures` na API pelo script `AlocacaoDeSalas-API/scripts/migrations/001-dates-features-events.js`.

---

## Critérios de Aceitação
- [x] `user` cria/edita/desativa turmas de um projeto do seu instituto
- [x] Editor de horários permite N faixas por semana com validação de `fim > início`
- [x] Requisitos são marcados por checkboxes com as 6 características fixas
- [x] `admin` vê em somente leitura
- [x] Código duplicado no projeto exibe erro inline
- [x] Turmas são acessadas a partir do projeto (rota aninhada)

---

## Questões em aberto / Evolução futura
- ~~**Eventos avulsos sem turma**~~ — **RESOLVIDA (implementada).** O cronograma aceita **eventos únicos de texto livre** (palestras, defesas, reuniões) sem cadastrar turma; o conceito de turma não mudou. Ver [Alocação Manual](./06-manual-allocation.md).
- **Período/curso da turma:** campo futuro (ex.: `period`), ainda não implementado, necessário para o critério de menor deslocamento da [alocação automática](./07-auto-allocation.md).
