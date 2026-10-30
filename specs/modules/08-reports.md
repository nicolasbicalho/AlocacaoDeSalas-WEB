# Módulo 8 — Relatórios e Exportação

**Status:** `implemented` — aprovada e implementada em 2026-10-30 (janela 07:00–22:00; exportação reaproveita o quadro de horários).
**Depende de:** Módulo 5 (Turmas), Módulo 6 (Alocação Manual e Cronograma), Módulo 7 (Alocação Automática), Módulo 11 (Professores)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/08-reports.md`](../../../AlocacaoDeSalas-API/specs/modules/08-reports.md)

> **O que mudou em relação ao rascunho:** a API ganha só o endpoint de **ocupação**; as grades por sala e por professor são montadas no navegador a partir dos endpoints que já existem. A **exportação da grade já existe** (quadro de horários da fase 4) e é reaproveitada; o único arquivo novo é a planilha de **ocupação**. A grade por professor usa o **cadastro de professores** (módulo 11). O **PDF** gerado no servidor deu lugar à **impressão** das grades pelo navegador. "Professor" segue sendo entidade de domínio, não role de login.

---

## Visão Geral

Nova aba **Relatórios** no projeto, com três visões: **Ocupação** das salas, **Grade por sala** e **Grade por professor**, além da **exportação** do quadro de horários (já existente) e da ocupação. Acessível por `user` (gerente do instituto) e `admin` (leitura), em projetos de qualquer status.

---

## Estrutura do Módulo

```
modules/report/
├── views/
│   └── ReportView.vue             # abas Ocupação | Grade por sala | Grade por professor
├── components/
│   ├── OccupancySummary.vue       # números do resumo + ocupação por turno
│   ├── OccupancyChart.vue         # barras horizontais, uma por sala
│   ├── OccupancyHeatmap.vue       # salas ocupadas por dia × hora
│   ├── WeeklyScheduleTable.vue    # grade semanal (usada por sala e por professor)
│   └── ExportMenu.vue             # quadro de horários (existente) e ocupação
├── services/
│   └── report.service.ts          # getOccupancy
├── helpers.ts                     # roomSchedule, professorSchedule, occupancyRows (funções puras)
├── helpers.test.ts
├── export.ts                      # XLSX da ocupação (exceljs, lazy)
├── print.ts                       # impressão só da grade (8.5)
└── index.ts                       # reportProjectChildren
```

---

## Rotas

Filha de `/projects/:projectId` (renderizada dentro do `ProjectShell`), como Turmas e Cronograma:

| Path | View | Roles |
|------|------|-------|
| `/projects/:projectId/reports` | `ReportView` | `admin`, `user` |

- O `ProjectShell` ganha a aba **"Relatórios"** depois de "Cronograma" (`section: 'reports'`).
- Estado na URL: `?tab=occupancy|room|professor`, `building=<id>`, `saturday=1`, `room=<id>`, `professor=<id>` — dá para compartilhar o link e voltar com o navegador.

---

## 8.1 Aba Ocupação

### Chamada à API

```
GET /projects/:projectId/reports/occupancy?buildingId=…&saturday=true
```

### Layout

- Filtros: **prédio** ("Todos" + prédios do instituto) e **"Incluir sábado"**. A janela usada aparece em texto: "Seg–Sex, 07:00–22:00 · 75 h por sala por semana".
- **Resumo** (`OccupancySummary`): ocupação de horário, aproveitamento de lugares, salas usadas / ociosas e eventos únicos (contados à parte). Se houver turmas "a definir": "N horário(s) de turmas sem nº de alunos ficaram fora do aproveitamento → Preencher" (link para a aba Turmas, como a pendência do dashboard).
- **Por turno:** manhã, tarde e noite, cada um com a sua ocupação (barra curta + percentual).
- **Por sala** (`OccupancyChart`): barras horizontais com a ocupação de cada sala, agrupadas por prédio quando o filtro é "Todos", ordenadas da mais para a menos ocupada dentro do grupo. Rótulo: "Sala 101 · 40 lugares", valor "30% · 24 h". Salas **ociosas** (0 h) com selo "Ociosa"; salas inativas com selo "Inativa". Ao lado, o aproveitamento de lugares de cada sala ("85% dos lugares"; "—" quando não se aplica). Clicar numa sala abre a aba **Grade por sala** com ela selecionada.
- **Mapa de calor** (`OccupancyHeatmap`): dias nas linhas, horas nas colunas, cor proporcional a quantas salas estão ocupadas; o tooltip diz "Ter 08h · 14 de 23 salas ocupadas". Mostra de relance o horário de pico e onde há folga.
- **Cores:** a ocupação usa **um único tom** em intensidades crescentes (sem verde/amarelo/vermelho): sala pouco ocupada não é "erro", e a janela de 75 h faz quase toda sala parecer "vermelha" no esquema do rascunho. Segue o skill de visualização de dados do projeto e o dark mode.

### Estados

- **Carregando:** skeleton dos blocos.
- **Sem eventos recorrentes:** "Nenhuma aula semanal no cronograma ainda." com link para o Cronograma (e para a alocação automática, se o usuário for `user` e o projeto não estiver encerrado).
- **Erro:** mensagem com "Tentar de novo".

---

## 8.2 Aba Grade por sala

- Seletor de sala (busca por nome, agrupado por prédio); sem seleção, mostra a primeira sala do primeiro prédio.
- `WeeklyScheduleTable`: **faixas de horário nas linhas** e **dias (Seg–Sex, + Sáb se houver aula) nas colunas**, como o quadro de horários da fase 4. Cada célula: disciplina (código), professor, papel quando for prática ("Prática"), selo "Auto" nos eventos da alocação automática.
- Abaixo, **eventos únicos** da sala em ordem de data ("12/11 · 14:00–16:00 · Palestra de IA"), com link que abre o Cronograma na data do evento (`?event=<id>`, link já existente).
- Cabeçalho com capacidade, características e ocupação da sala (do relatório de ocupação, quando já carregado).
- Botão **"Imprimir"** (ver 8.5).

**Dados:** `listAllocations(projectId)`, `listTurmas({ projectId })`, `listRooms`, `listBuildings` — sem endpoint novo. A montagem é a função pura `roomSchedule(...)` em `helpers.ts`.

---

## 8.3 Aba Grade por professor

- Seletor de professor do **cadastro do instituto** (`listProfessors`), só os que têm turma ativa no projeto; sem seleção, o primeiro em ordem alfabética.
- Mesma `WeeklyScheduleTable`, com os horários **das turmas do professor** (`turma.professorId`). Cada célula: disciplina (código), sala ("Sala 101"; com prática, "T: Sala 101 · P: Lab. de Redes") ou **"sem sala"** em destaque quando o horário ainda não foi alocado — a grade do professor serve também para conferir o que falta.
- Turmas antigas sem `professorId` não aparecem aqui (aparecem nas exportações, com o nome digitado).
- Link para o detalhe do professor (módulo 11) e botão **"Imprimir"**.

**Dados:** os mesmos da 8.2 + `listProfessors`. Função pura `professorSchedule(...)`, reaproveitando a regra de cobertura de `summarizeTurmaRooms` (um horário está coberto quando um evento recorrente da turma e do papel abrange o horário inteiro).

---

## 8.4 Exportação (`ExportMenu`)

Menu **"Exportar"** no canto superior direito da tela de relatórios, disponível em todas as abas:

| Opção | Arquivo | Conteúdo |
|-------|---------|----------|
| **Quadro de horários (XLSX)** | `quadro-de-horarios-{projeto}.xlsx` | a exportação de grade **já existente** (aba Turmas e Cronograma, `downloadTimetable`, fase 4): quadro semanal, turmas e salas. Não é reimplementada |
| **Ocupação (XLSX)** | `ocupacao-{projeto}.xlsx` | abas "Resumo" (janela, totais e turnos), "Salas" (uma linha por sala com todas as colunas de `rooms`) e "Mapa de calor", com os filtros atuais da aba Ocupação |

- As linhas da planilha de ocupação vêm da função pura `occupancyRows(...)` (testada); `export.ts` só formata. `exceljs` carregado sob demanda, como na fase 4.
- Enquanto gera: botão "Exportar" com loading e itens desabilitados; erro → toast.

---

## 8.5 Impressão

As abas de grade têm **"Imprimir"** (`window.print()`, via `print.ts`): a grade com o cabeçalho (projeto, sala ou professor, período) é copiada para fora do app e só ela é impressa, em paisagem, com texto escuro sobre fundo branco também no tema escuro, sem navegação nem botões. Substitui o PDF do rascunho: o navegador já salva em PDF, sem biblioteca nova nem geração no servidor.

---

## Arquivos modificados fora do módulo

| Arquivo | Mudança |
|---------|---------|
| `src/modules/project/index.ts` | inclui `reportProjectChildren` nas filhas de `/projects/:projectId` |
| `src/modules/project/views/ProjectShell.vue` | aba "Relatórios" |
| `src/types/index.ts` | tipos da resposta de ocupação |
| `specs/README.md`, `specs/shared/routing.md`, `specs/shared/testing.md` | módulo 8, rota e status de testes |

---

## Critérios de Aceitação

- [x] Aba "Relatórios" no projeto para `user` e `admin`, em qualquer status de projeto
- [x] Ocupação mostra resumo, turnos, barras por sala (ociosas e inativas sinalizadas), aproveitamento de lugares e mapa de calor
- [x] Filtros de prédio e sábado refazem a consulta e ficam na URL
- [x] Aviso de turmas "a definir" leva à aba Turmas
- [x] Clicar numa sala da ocupação abre a grade daquela sala
- [x] Grade por sala mostra as aulas semanais da sala e lista os eventos únicos com link para o Cronograma
- [x] Grade por professor mostra os horários das turmas do professor, com sala teórica/prática ou "sem sala"
- [x] Menu Exportar reaproveita o quadro de horários existente e baixa a planilha de ocupação com os filtros atuais
- [x] Impressão da grade em paisagem, sem a navegação
- [x] Estado vazio na ocupação quando não há aulas semanais
- [x] `roomSchedule`, `professorSchedule` e `occupancyRows` cobertas por testes
- [x] Dark mode em todos os elementos novos
