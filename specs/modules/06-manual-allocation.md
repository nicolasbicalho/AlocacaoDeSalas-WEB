# Módulo 6 — Alocação Manual e Cronograma

**Status:** `implemented`
**Depende de:** Módulo 3 (Projetos), Módulo 4 (Estrutura Física) e Módulo 5 (Turmas)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/06-manual-allocation.md`](../../../AlocacaoDeSalas-API/specs/modules/06-manual-allocation.md)

> **Ordem de desenvolvimento:** a alocação **manual é implementada antes** da automática (Módulo 7). Ela introduz a entidade **evento** e a visão de **cronograma**, que a alocação automática depois preencherá em lote.

> **Feedback do gerente (2026-10) — fase 1 implementada:** filtro **"Mostrar"** (todos / graduação / pós-graduação / externas / só eventos únicos) e legenda por categoria: eventos **recorrentes** usam o tom da categoria da turma (graduação = azul, pós = verde-água, externa = cinza); **únicos** mantêm a cor escolhida e o selo "Único". Os contadores da faixa da semana seguem o filtro.
> **Fase 2 implementada:** [sugestão de salas](#sugestão-de-salas) no modal — livres, compatíveis e ordenadas por melhor encaixe e pelas preferências do professor.
> **Fase 3 implementada:** turmas com **aula prática no mesmo horário** — o evento tem papel (teórica/prática); a grade mostra as duas salas da turma no mesmo horário, cada uma com o seu papel. Ver o [plano](../../../AlocacaoDeSalas-API/specs/plans/2026-10-plano-feedback-gerente.md).

---

## Visão Geral

O sistema mantém um **cronograma** de eventos de sala por projeto (na API, coleção `allocations`; antes chamados "utilizações"). Um **evento** ocupa uma sala em um horário e pode ser:

- **Recorrente** (`weekly`) — sempre de uma turma; repete-se toda semana no mesmo dia/horário entre a data de início e a de término do projeto;
- **Único** (`single`) — em uma data do semestre; de uma turma (ex.: reposição) **ou** de texto livre (ex.: "Palestra de IA"), com uma **cor** escolhida.

O `user` (gerente do instituto) monta o cronograma manualmente: adiciona eventos, move/edita ou remove. `admin` tem leitura. Conflitos (sala ou turma ocupadas no horário) são detectados pelo servidor e exibidos no modal.

Decisões de modelagem (MVP): **datas reais do semestre** — o calendário é navegado por data, dentro do período `startDate`..`endDate` do projeto *(substitui o antigo "semanal implícito sem datas")*; e **horário a horário** (a unidade é evento + sala + 1 horário; uma turma pode usar salas diferentes em cada horário). Qualquer horário livre é permitido — não há vínculo obrigatório com a `schedule` da turma.

---

## Estrutura do Módulo

```
modules/allocation/
├── views/
│   └── AllocationView.vue        # Página única: faixa da semana + grade da data + lista de eventos únicos
├── components/
│   ├── WeekStrip.vue             # Faixa Seg–Sáb com as datas reais da semana, ◀ ▶ e campo de data
│   ├── ScheduleGrid.vue          # Grade sala × hora de UMA data (régua fixa por hora), célula livre clicável
│   └── AllocationModal.vue       # Adicionar / mover evento (tipo, turma ou título, cor, conflitos)
├── services/
│   └── allocation.service.ts     # list / create / move / delete
├── helpers.ts                    # dias da semana, weekdayFromDate, datas da semana/semestre, cores, formatação
└── index.ts                      # rotas do módulo
```

O antigo toggle **Grade/Lista** (e a visão "v1 lista") foi **removido**: há uma única página.

---

## Modelo de Dados (esperado da API)

```typescript
type AllocationType = 'weekly' | 'single'   // UI: "Recorrente" | "Único"
type EventColor = 'amber' | 'emerald' | 'rose' | 'violet' | 'sky' | 'orange'

interface IAllocation {
  id: string
  projectId: string
  instituteId: string
  turmaId?: string        // obrigatório em recorrente; em único, exclusivo com `title`
  title?: string          // evento único de texto livre (2–120 caracteres)
  color?: EventColor      // só em único (padrão 'amber')
  roomId: string
  timeSlot: { day: WeekDay; start: string; end: string }
  type: AllocationType
  date?: string           // 'YYYY-MM-DD', só em único
  role?: 'teorica' | 'pratica'  // presente em todo evento de turma (eventos antigos vêm como 'teorica')
  createdAt: string
  updatedAt: string
}
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:projectId/allocation` | aba **Cronograma** do `ProjectShell` (`AllocationView`) | `user` (edição), `admin` (leitura) |

Acesso a partir de `ProjectDetailView` pelo botão **"Ver cronograma"** e dos links da página inicial (Módulo 10).

### Deep link (query params)

| Param | Efeito |
|-------|--------|
| `event=<id>` | leva a grade até o evento único (data dele, todos os prédios) e o destaca |
| `date=YYYY-MM-DD` | seleciona a data (se estiver no semestre) |
| `turma=<id>&start=HH:MM&end=HH:MM` | abre o modal de criação já com turma, dia da semana (da data) e horário — só para `user` |
| `role=pratica` | (com `turma`) abre o modal já na **prática** — usado pelos atalhos de um horário que só falta a sala de prática |

A query é lida uma vez ao carregar e depois limpa da URL (recarregar não reabre o modal).

---

## 6.1 Cronograma (`AllocationView`)

- Breadcrumb: "Projetos / {nome} / Cronograma" + badge de status do projeto.
- Cartões de estatística do cronograma (eventos, salas usadas, turmas com sala — de N).
- Botão **"Adicionar evento"** (visível para `user` com projeto não encerrado) e **"Baixar quadro de horários"** (todos; o mesmo XLSX da aba Turmas — ver [05, seção 5.5](./05-turmas.md#55-quadro-de-horários-download)).
- Carrega em paralelo: projeto (com `startDate`/`endDate`), turmas, salas e eventos; monta mapas turma/sala para exibir nomes.
- Estado vazio quando não há eventos.

### Navegação por data (`WeekStrip`)

- Faixa da semana **Seg–Sáb** com as **datas reais** de cada dia; a data selecionada fica destacada.
- Botões **◀ ▶** trocam de semana; um **campo de data** permite saltar para qualquer dia.
- Limitada ao período do semestre: dias fora de `startDate`..`endDate` ficam **desabilitados**.
- Data inicial: **hoje**, se estiver dentro do semestre; senão, `startDate`.

### Grade (`ScheduleGrid`)

- Grade `sala × hora` de **uma data** (a selecionada na `WeekStrip`), com filtro por prédio; salas agrupadas por prédio quando "Todos".
- Mostra **todos os eventos da data**: os recorrentes cujo `timeSlot.day` é o dia da semana da data + os únicos com `date` igual à data.
- **Régua fixa por hora** (janela 07h–19h, expandida conforme os dados): célula vazia é clicável para adicionar naquele horário (modal já preenchido com sala, data e horário); célula ocupada mostra o evento (turma ou título) e ocupa N colunas conforme a duração.
- **Cores:** eventos únicos usam a cor escolhida (`color`); recorrentes usam a cor primária padrão.

### Lista de eventos únicos

- Abaixo da grade, uma lista **só com os eventos únicos**, ordenada por data.
- Clicar em um item: seleciona a data dele na grade, volta o filtro de prédio para **"Todos"**, rola até a grade e **destaca o evento por ~2s**.

## 6.2 Adicionar / Mover (`AllocationModal`)

- **Tipo:** "Recorrente" | "Único".
- **Recorrente:** turma (obrigatória), sala, dia da semana, início e fim.
- **Único:** data (dentro do semestre; domingo barrado no cliente e no servidor; dia da semana derivado e exibido), sala, início e fim, e **exatamente um** entre turma (ex.: reposição) e título livre (2–120 caracteres, ex.: "Palestra de IA").
- **Paleta de cores:** quando o tipo é "Único", aparece uma paleta de amostras de cor (seleção única) com `EVENT_COLORS` — `amber` (padrão), `emerald`, `rose`, `violet`, `sky`, `orange`.
- Em modo **mover**, a turma fica fixa (muda sala/horário/tipo/data/cor; o título só para evento de texto livre) e chama `PATCH`. Evento de texto livre não pode virar recorrente (`ALLOCATION_WEEKLY_REQUIRES_TURMA`).
- **Sala para a aula** (fase 3): quando a turma escolhida tem aula prática, o modal pergunta **Teórica** ou **Prática** (padrão teórica; na edição, o papel do evento). O papel vai no payload (`role`) e na sugestão de salas; conflito do mesmo papel mostra "A turma já tem a aula teórica/prática nesse horário."
- Ordem dos campos: tipo → turma (ou título) → papel (se houver prática) → dia/data → início e fim → **salas sugeridas** → sala → cor (único). A sugestão depende da turma e do horário, por isso vem depois deles.
- Erros exibidos inline no modal: conflito de sala, conflito de turma, data fora do semestre (`ALLOCATION_DATE_OUT_OF_RANGE`), dados inválidos, projeto encerrado.

### Sugestão de salas

Quando o evento é de **turma** e o horário é válido, o modal consulta `GET …/allocations/suggestions` (debounce de 250 ms; na edição, com `excludeId` do próprio evento) e mostra o painel **"Salas sugeridas"**:
- cabeçalho "Salas sugeridas · teórica/prática" (turma com aula prática), o nº de alunos (ou "a definir") e as características exigidas **pelo papel** (na prática, as de `practice`); linha "{professor} prefere: …" quando há preferências;
- até **4 salas livres que servem** (comportam a turma inteira e têm as características), na ordem da API: nome · prédio, "50 lugares · sobram 5" e selos das preferências — verde ✓ atendida, vermelho ✗ não atendida, cinza "?" sala sem o dado;
- clicar numa sugestão escolhe a sala; "Fora da lista: …" resume as demais (mais que servem, livres que não servem, ocupadas); sem nenhuma que sirva, um aviso;
- **pré-seleção:** ao criar sem sala definida (ex.: atalho "Alocar →"), a melhor sugestão vem selecionada até o gerente escolher outra; sala vinda da célula clicada ou da edição não é trocada.

Abaixo do campo Sala, **avisos** para a sala escolhida (`roomWarnings`): ocupada no horário, capacidade menor que a turma, características faltando. São avisos — a alocação manual continua permitida; só os conflitos bloqueiam no servidor. Os textos ficam em `modules/allocation/suggestions.ts` (com testes).

## 6.3 Chamadas à API

```
GET    /projects/:projectId                             # período do semestre (startDate/endDate)
GET    /projects/:projectId/allocations                 # cronograma
POST   /projects/:projectId/allocations                 # criar (turmaId | title, roomId, timeSlot, type, date?, color?)
PATCH  /projects/:projectId/allocations/:id             # mover/editar (roomId, timeSlot, type, date?, title?, color?)
DELETE /projects/:projectId/allocations/:id             # remover
GET    /projects/:projectId/allocations/suggestions     # salas sugeridas (turmaId, role, type, day|date, start, end, excludeId?)
```

---

## Critérios de Aceitação

- [x] Página única, sem toggle Grade/Lista: faixa da semana + grade da data + lista de eventos únicos
- [x] `WeekStrip` mostra Seg–Sáb com as datas reais, troca de semana (◀ ▶) e salta por campo de data
- [x] Datas fora do semestre ficam desabilitadas; data inicial = hoje (se no semestre) ou `startDate`
- [x] Grade `sala × hora` da data selecionada mostra recorrentes do dia da semana + únicos da data
- [x] Grade com filtro por prédio e agrupamento por prédio
- [x] Célula vazia da grade abre o modal já preenchido (sala + data + horário)
- [x] `user` adiciona evento recorrente (turma) ou único (turma ou título livre)
- [x] Evento único tem paleta de cores (padrão `amber`); na grade, únicos usam a cor escolhida e recorrentes a cor primária
- [x] Lista de eventos únicos ordenada por data; clicar seleciona a data, volta o filtro para "Todos", rola até a grade e destaca o evento por ~2s
- [x] Conflito de sala ou de turma e data fora do semestre são exibidos no modal (sem fechar), sem duplicar no cronograma
- [x] `user` move/edita (PATCH) e remove (com confirmação) eventos
- [x] `admin` vê o cronograma em somente leitura (sem ações de edição)
- [x] Dark mode em todos os elementos do módulo
- [x] Modal mostra as salas sugeridas (livres e compatíveis, com selos das preferências do professor); clicar escolhe a sala
- [x] Ao criar sem sala definida, a melhor sugestão vem pré-selecionada; na edição, o próprio evento não ocupa a sala
- [x] Sala escolhida que não comporta, não tem as características ou está ocupada gera aviso no modal
- [x] Turma com aula prática: o modal pergunta o papel (teórica/prática) e a sugestão usa os requisitos do papel
- [x] Grade mostra a teórica e a prática da turma no mesmo horário, com "Teórica"/"Prática" no subtítulo; a lista de únicos indica o papel da reposição

---

## Questões em aberto / Evolução futura
- ~~**Eventos avulsos sem turma**~~ — **RESOLVIDA (implementada):** o modal permite criar evento **único** de texto livre (título) sem turma cadastrada, conforme a alternativa (a) da [API 06](../../../AlocacaoDeSalas-API/specs/modules/06-manual-allocation.md).
