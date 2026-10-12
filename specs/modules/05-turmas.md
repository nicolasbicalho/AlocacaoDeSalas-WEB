# Módulo 5 — Gerenciamento de Turmas

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth), Módulo 2 (Institutes), Módulo 3 (Projects)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/05-turmas.md`](../../../AlocacaoDeSalas-API/specs/modules/05-turmas.md)

> **Feedback do gerente (2026-10) — fase 1 implementada:** a aba Turmas é a ferramenta principal do gerente (seções 5.1 e 5.2).
> **Fase 2 implementada:** campo Professor com **autocompletar** do cadastro de professores e **seletor de professor** na aba Turmas ([módulo 11](./11-professors.md)).
> **Planejado:** sala de prática simultânea (fase 3). Ver o [plano](../../../AlocacaoDeSalas-API/specs/plans/2026-10-plano-feedback-gerente.md).

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
Aba **Turmas** do projeto, pensada como a ferramenta de trabalho do gerente:

- **Abas por categoria:** Todas · Graduação · Pós-graduação · Externas, com contadores (`GET /turmas/counts`). Atalho **"Eventos únicos →"** para o cronograma, onde os únicos são listados.
- **Busca** por disciplina, professor, código ou setor (debounce de 300 ms; também atualiza os contadores das abas).
- **Seletor de professor** ("Todos os professores" + cadastro do instituto): filtra a lista e os contadores das abas (`professorId`).
- Aba, busca e professor ficam na URL (`?categoria=pos&q=dmat&professor=<id>`): voltar do detalhe de uma turma mantém o filtro.
- **Ordem alfabética do português**, vinda da API (acentos e maiúsculas não interferem). 50 turmas por página.
- Colunas: **Disciplina** (📝 quando há anotações, com o texto no *tooltip*), Código, Categoria (só na aba Todas), Professor, Setor, **Horários** (ex.: "Seg 08:00–10:00"), **Nº alunos**, **Sala(s)**, Status, Ver.
- **Nº alunos editável na célula** (`StudentCountCell`): clicar abre o campo; **Enter** ou sair do campo salva (`PUT /turmas/:id { studentCount }`), **Esc** cancela; vazio = "a definir" (selo âmbar). Mostra confirmação e, em erro, desfaz. Somente leitura para `admin`.
- **Sala(s):** nomes das salas dos eventos **recorrentes** da turma e o progresso — "2/2 horários" (verde), "1/2 horários" ou "sem sala" (âmbar) — com **"Alocar →"** que abre o cronograma na próxima data do primeiro horário pendente, já com o modal preenchido (mesmo link profundo do dashboard). Um horário conta como coberto quando um evento recorrente da turma, no mesmo dia, abrange o horário inteiro (`summarizeTurmaRooms`, em `modules/turma/helpers.ts`).

Botão "Nova turma" (`user`).

## 5.2 Form (`TurmaForm`)
- Campos, na ordem da planilha do gerente: **Disciplina**, **Código da turma** (obrigatório), **Nº de alunos** (opcional — em branco = "a definir"), **Categoria** (Graduação / Pós-graduação / Disciplina externa), **Professor**, **Setor (departamento)** e **Anotações** (texto livre, como veio da planilha).
- **Professor** com autocompletar (`<datalist>`) do cadastro; mostra as preferências do professor reconhecido ou avisa "Professor novo — será cadastrado ao salvar" ([11.4](./11-professors.md#114-integração-com-turmas)).
- **Requisitos (`FeatureCheckboxes`)**: checkboxes com as 5 características fixas (`ROOM_FEATURES`); a seleção é enviada como `requiredFeatures: RoomFeature[]`. A turma só cabe em salas cujas características incluam todas as exigidas (`sala.features ⊇ turma.requiredFeatures`).
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
- [x] Abas Todas / Graduação / Pós-graduação / Externas com contadores; busca por disciplina, professor, código ou setor
- [x] Lista em ordem alfabética correta em português
- [x] Nº de alunos editável direto na tabela (Enter/Esc), aceitando "a definir"
- [x] Coluna Sala(s) com salas alocadas, progresso dos horários e atalho "Alocar →"
- [x] Formulário com categoria, setor (departamento) e anotações; código obrigatório
- [x] Editor de horários permite N faixas por semana com validação de `fim > início`
- [x] Requisitos são marcados por checkboxes com as 5 características fixas
- [x] Professor com autocompletar do cadastro; filtro por professor na aba Turmas
- [x] `admin` vê em somente leitura
- [x] Código duplicado no projeto exibe erro inline
- [x] Turmas são acessadas a partir do projeto (rota aninhada)

---

## Questões em aberto / Evolução futura
- ~~**Eventos avulsos sem turma**~~ — **RESOLVIDA (implementada).** O cronograma aceita **eventos únicos de texto livre** (palestras, defesas, reuniões) sem cadastrar turma; o conceito de turma não mudou. Ver [Alocação Manual](./06-manual-allocation.md).
- **Período/curso da turma:** campo futuro (ex.: `period`), ainda não implementado, necessário para o critério de menor deslocamento da [alocação automática](./07-auto-allocation.md).
