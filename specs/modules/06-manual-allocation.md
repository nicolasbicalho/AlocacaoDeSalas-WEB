# Módulo 6 — Alocação Manual e Cronograma

**Status:** `implemented`
**Depende de:** Módulo 4 (Estrutura Física) e Módulo 5 (Turmas)
**API correspondente:** `AlocacaoDeSalas-API/specs/modules/06-manual-allocation.md`

> **Ordem de desenvolvimento:** a alocação **manual é implementada antes** da automática (Módulo 7). Ela introduz a entidade de **utilização** e a visão de **cronograma**, que a alocação automática depois preencherá em lote.

---

## Visão Geral

O sistema mantém um **cronograma** de utilizações de salas por projeto. Uma **utilização** representa uma turma ocupando uma sala em um horário — `weekly` (repete o semestre) ou `single` (um único dia, com data).

O `user` (gerente do instituto) monta o cronograma manualmente: adiciona utilizações, move ou remove. `admin` tem leitura. Conflitos (sala ou turma ocupadas no horário) são detectados pelo servidor e exibidos no modal.

Decisões de modelagem (MVP): **semanal implícito** no semestre (sem datas) e **horário a horário** (a unidade é turma + sala + 1 horário; uma turma pode usar salas diferentes em cada horário). Qualquer horário livre é permitido — não há vínculo obrigatório com a `schedule` da turma.

---

## Estrutura do Módulo

```
modules/allocation/
├── views/
│   └── AllocationView.vue        # Cronograma do projeto (semanal + dia único + stats)
├── components/
│   └── AllocationModal.vue       # Adicionar / mover utilização (com detecção de conflito)
├── services/
│   └── allocation.service.ts     # list / create / move / delete
├── helpers.ts                    # dias da semana, weekdayFromDate, formatação
└── index.ts                      # rotas do módulo
```

O cronograma é apresentado como **listas agrupadas** (por dia da semana, no semanal; por data, no dia único), priorizando clareza e CRUD — uma grade matricial `sala × horário` fica como evolução futura.

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:projectId/allocation` | `AllocationView` | `user` (edição), `admin` (leitura) |

Acesso a partir de `ProjectDetailView` pelo botão **"Ver cronograma"**.

---

## 6.1 Cronograma (`AllocationView`)

- Breadcrumb: "Projetos / {nome} / Cronograma" + badge de status do projeto.
- Cartões de estatística: total de utilizações, salas usadas, turmas com sala (de N), dias com uso único.
- Botão **"Adicionar utilização"** (visível para `user` com projeto não encerrado).
- Seção **Semanal**: um cartão por dia da semana com utilizações (horário, sala, turma — professor, ações).
- Seção **Dia único**: um cartão por data (com o dia da semana) e suas utilizações.
- Estado vazio quando não há utilizações.
- Carrega em paralelo: projeto, turmas, salas e utilizações; monta mapas turma/sala para exibir nomes.

## 6.2 Adicionar / Mover (`AllocationModal`)

- Campos: turma, sala, recorrência (`weekly` | `single`), dia da semana (weekly) **ou** data (single), início e fim.
- Em `single`, o dia da semana é derivado da data e exibido; datas em domingo são barradas no cliente e no servidor.
- Em modo **mover**, a turma fica fixa (só muda sala/horário/recorrência) e chama `PATCH`.
- Erros exibidos inline no modal: conflito de sala, conflito de turma, dados inválidos, projeto encerrado.

## 6.3 Chamadas à API

```
GET    /projects/:projectId/allocations                 # cronograma
POST   /projects/:projectId/allocations                 # criar (turmaId, roomId, timeSlot, type, date?)
PATCH  /projects/:projectId/allocations/:id             # mover (roomId, timeSlot, type, date?)
DELETE /projects/:projectId/allocations/:id             # remover
```

---

## Critérios de Aceitação

- [x] `user` visualiza o cronograma (semanal e dia único) com salas e turmas resolvidas por nome
- [x] `user` adiciona utilização escolhendo turma, sala e horário livre
- [x] Suporta utilização de **dia único** (data) além de semanal; domingo é barrado
- [x] Conflito de sala ou de turma é exibido no modal (sem fechar), sem duplicar no cronograma
- [x] `user` move (PATCH) e remove (com confirmação) utilizações
- [x] Estatísticas de ocupação e turmas com sala são exibidas
- [x] `admin` vê o cronograma em somente leitura (sem ações de edição)
- [x] Dark mode em todos os elementos do módulo
