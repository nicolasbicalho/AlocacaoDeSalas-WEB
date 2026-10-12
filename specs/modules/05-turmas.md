# Módulo 5 — Gerenciamento de Turmas

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth), Módulo 2 (Institutes), Módulo 3 (Projects)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/05-turmas.md`](../../../AlocacaoDeSalas-API/specs/modules/05-turmas.md)

> **Feedback do gerente (2026-10) — fase 1 implementada:** a aba Turmas é a ferramenta principal do gerente (seções 5.1 e 5.2).
> **Fase 2 implementada:** campo Professor com **autocompletar** do cadastro de professores e **seletor de professor** na aba Turmas ([módulo 11](./11-professors.md)).
> **Fase 4 implementada:** [importação da planilha](#54-importar-planilha-turmaimportview-fase-4) (XLSX/CSV, com prévia) e [quadro de horários](#55-quadro-de-horários-download) para baixar.
> **Fase 3 implementada:** **aula prática no mesmo horário** — a turma pode ocupar duas salas ao mesmo tempo (teórica e de prática); a coluna Sala(s) mostra os dois papéis. Ver o [plano](../../../AlocacaoDeSalas-API/specs/plans/2026-10-plano-feedback-gerente.md).

---

## Visão Geral

Telas para o `user` cadastrar as **turmas** de um projeto — o insumo que, junto com as salas, alimenta a alocação automática. Cada turma tem tamanho, professor, **requisitos** (características que a sala precisa ter, da mesma lista fixa das salas) e uma **grade de horários semanais**. `admin` visualiza (somente leitura).

Turmas são acessadas **a partir do projeto** (rota aninhada por `projectId`).

---

## Estrutura do Módulo

```
modules/turma/
├── views/        # TurmaListView, TurmaCreateView, TurmaDetailView, TurmaImportView
├── components/   # TurmaForm, ScheduleEditor, StudentCountCell
├── import/       # spreadsheet.ts (XLSX/CSV), mapping.ts (colunas)
├── services/turma.service.ts
├── timetable.ts / timetable.export.ts   # quadro de horários
└── index.ts
```

Os requisitos usam o componente compartilhado `FeatureCheckboxes` (`src/shared/components/`), o mesmo das salas.

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:projectId/turmas` | aba **Turmas** do `ProjectShell` (`TurmaListView`) | `admin`, `user` |
| `/projects/:projectId/turmas/new` | `TurmaCreateView` (aba Turmas) | `user` |
| `/projects/:projectId/turmas/import` | `TurmaImportView` (aba Turmas) — declarada antes de `:turmaId` | `user` |
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
- **Sala(s):** nomes das salas dos eventos **recorrentes** da turma e o progresso. Numa turma com aula prática, uma linha por papel — sala(s) e selo "Teórica · 2/2 horários" / "Prática · sem sala" — e o atalho diz qual falta ("Alocar teórica →" / "Alocar prática →", com `role` no link). Para as demais, como antes: — "2/2 horários" (verde), "1/2 horários" ou "sem sala" (âmbar) — com **"Alocar →"** que abre o cronograma na próxima data do primeiro horário pendente, já com o modal preenchido (mesmo link profundo do dashboard). Um horário conta como coberto quando um evento recorrente da turma, no mesmo dia, abrange o horário inteiro (`summarizeTurmaRooms`, em `modules/turma/helpers.ts`). Com aula prática, o horário só está completo com a teórica **e** a prática; eventos sem papel (anteriores à fase 3) contam como teóricos.

Botões "Baixar quadro de horários" (todos), "Importar planilha" e "Nova turma" (`user`).

## 5.2 Form (`TurmaForm`)
- Campos, na ordem da planilha do gerente: **Disciplina**, **Código da turma** (obrigatório), **Nº de alunos** (opcional — em branco = "a definir"), **Categoria** (Graduação / Pós-graduação / Disciplina externa), **Professor**, **Setor (departamento)** e **Anotações** (texto livre, como veio da planilha).
- **Aula prática** (fase 3): caixa "Tem aula prática no mesmo horário" — a turma ocupa duas salas ao mesmo tempo em cada horário, e as duas comportam a turma inteira (D9). Marcada, aparecem os **Requisitos da sala de prática** (`FeatureCheckboxes`) e os requisitos de cima passam a se chamar "Requisitos da sala teórica". Envia `practice: { requiredFeatures } | null`. Desmarcar com eventos de prática no cronograma → aviso `TURMA_PRACTICE_IN_USE` ("remova-os antes").
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

## 5.4 Importar planilha (`TurmaImportView`, fase 4)

Botão **"Importar planilha"** na aba Turmas (`user`), também no estado vazio. Rota `turmas/import` (breadcrumb `… › Turmas › Importar planilha`). Sem uma amostra da planilha real (D8), a tela foi feita para se adaptar: **lê o arquivo no navegador**, detecta as colunas e deixa o gerente corrigir antes de gravar. A interpretação dos horários e a validação ficam na API ([API 05, seção 5.6](../../../AlocacaoDeSalas-API/specs/modules/05-turmas.md#56-importação-da-planilha-fase-4)).

1. **Planilha** — XLSX ou CSV. "**Baixar modelo (.xlsx)**" gera uma planilha com as colunas esperadas e dois exemplos. Texto de ajuda com as colunas do gerente (Nome da disciplina, Código da turma, Dia da semana e horário, Setor, Professor, Anotações; Nº de alunos e Categoria opcionais) e os formatos de horário aceitos.
   - XLSX pela **exceljs**, carregada **só** nesta tela e no download do quadro (pedaço separado no build). XLS antigo → mensagem pedindo .xlsx ou .csv.
   - CSV com separador detectado (`;` do Excel em português, vírgula ou tab), aspas e quebras de linha dentro de aspas; arquivo em Windows-1252 é reconhecido (acentos corretos).
2. **Colunas** — aba (se houver mais de uma), **linha de títulos** (detectada entre as 10 primeiras: a que mais se parece com os nomes esperados; aceita título de planilha acima) e um seletor por campo (`A · Nome da disciplina`…), pré-preenchido pelos títulos, sem diferenciar acentos/maiúsculas (ex.: "Disciplina", "Turma", "Horário", "Departamento", "Docente", "Obs.", "Nº de alunos", "Nível"). Obrigatórios: disciplina, código e professor. **Categoria padrão** para as linhas sem categoria.
3. **Prévia** — automática a cada mudança (`POST /turmas/import/preview`, debounce de 300 ms): contadores **Nova · Atualizar · Sem mudanças · Erro** e tabela por linha (linha do arquivo, situação, disciplina, código, horários interpretados, professor com selo "novo", categoria, "muda: …" e problemas em português — ✗ erro, ⚠ aviso). Filtro "Só linhas com problema"; até 500 linhas exibidas.
4. **Importar N turma(s)** — `POST /turmas/import`; as linhas com erro ficam de fora (o botão avisa). Ao fim, o resumo ("3 criadas, 1 atualizada…") com **Ver turmas** e **Importar outro arquivo**. Reimportar não duplica (chave = código) e célula vazia não apaga.

Código: `modules/turma/import/` (`spreadsheet.ts` — leitura; `mapping.ts` — colunas e linhas; testes em `import.test.ts`).

## 5.5 Quadro de horários (download)

Botão **"Baixar quadro de horários"** na aba Turmas e no Cronograma (`admin` e `user`). Gera no navegador um **XLSX** com todas as turmas ativas do semestre (`quadro-de-horarios-{projeto}.xlsx`), pronto para imprimir (paisagem, ajustado à largura):

| Aba | Conteúdo |
|-----|----------|
| **Quadro semanal** | título, semestre e período; uma linha por **faixa de horário** (ex.: 08:00–10:00, 14:00–17:00) e uma coluna por dia (Seg–Sáb). Cada célula lista as turmas daquele horário: "Disciplina (CÓD) [Pós-graduação] · sala · professor"; com aula prática, "T: Sala 101 · P: Lab. de Redes"; sem sala, "sem sala" |
| **Turmas** | uma linha por turma e horário: dia, início, fim, disciplina, código, categoria, professor, setor, nº de alunos, sala teórica, sala de prática e **situação** (com sala, sem sala, falta teórica/prática, sem horário); com filtro |
| **Salas** | ocupação semanal de cada sala ativa (prédio · sala × dia), com as aulas recorrentes |

As salas vêm dos eventos **recorrentes** (mesma regra de cobertura da coluna Sala(s)); eventos únicos não entram no quadro semanal. A montagem é uma função pura (`modules/turma/timetable.ts`, com testes); o XLSX é gerado em `timetable.export.ts`.

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
- [x] Turma com aula prática simultânea (requisitos próprios da sala de prática); coluna Sala(s) por papel com atalho para o papel que falta
- [x] Importar XLSX/CSV: colunas detectadas e ajustáveis, prévia por linha, importação das linhas válidas, modelo para baixar
- [x] CSV do Excel em português (ponto e vírgula, Windows-1252) lido com acentos corretos
- [x] Baixar o quadro de horários do semestre (XLSX com quadro semanal, lista de turmas e ocupação por sala), na aba Turmas e no Cronograma
- [x] `admin` vê em somente leitura
- [x] Código duplicado no projeto exibe erro inline
- [x] Turmas são acessadas a partir do projeto (rota aninhada)

---

## Questões em aberto / Evolução futura
- ~~**Eventos avulsos sem turma**~~ — **RESOLVIDA (implementada).** O cronograma aceita **eventos únicos de texto livre** (palestras, defesas, reuniões) sem cadastrar turma; o conceito de turma não mudou. Ver [Alocação Manual](./06-manual-allocation.md).
- **Período/curso da turma:** campo futuro (ex.: `period`), ainda não implementado, necessário para o critério de menor deslocamento da [alocação automática](./07-auto-allocation.md).
