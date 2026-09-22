# Módulo 6 — Alocação Manual e Cronograma

**Status:** `draft`
**Depende de:** Módulo 4 (Estrutura Física) e Módulo 5 (Turmas)
**API correspondente:** `AlocacaoDeSalas-API/specs/modules/06-manual-allocation.md` (a ser criado)

> **Ordem de desenvolvimento:** a alocação **manual é implementada antes** da automática (Módulo 7). Ela introduz a entidade de **utilização** e a visão de **cronograma**, que a alocação automática depois preencherá em lote.

---

## Visão Geral

O sistema mantém um **calendário de utilizações** de salas ao longo do semestre de um projeto. Uma **utilização** representa uma turma ocupando uma sala em um horário — podendo se repetir semanalmente durante o semestre ou ocorrer em um único dia.

Neste módulo, o `user` (gerente do instituto) monta esse cronograma **manualmente**: visualiza o que cada sala tem ocupado e livre, escolhe um horário disponível em qualquer sala e adiciona uma utilização ao projeto — mesmo que seja apenas por um dia. O sistema detecta conflitos (sala já ocupada no horário) em tempo real.

Este é o alicerce sobre o qual o Módulo 7 (Alocação Automática) gera o cronograma completo de uma só vez.

---

## Estrutura do Módulo

```
modules/allocation/
├── views/
│   └── AllocationView.vue         # View principal (cronograma do projeto)
├── components/
│   ├── ScheduleGrid.vue           # Grade sala × horário (cronograma)
│   ├── AllocationCreateModal.vue  # Adicionar utilização manual (sala + horário + turma)
│   ├── AllocationEditModal.vue    # Mover / trocar utilização existente
│   ├── AllocationConflictAlert.vue# Alerta inline de conflito detectado
│   └── AllocationStats.vue        # Estatísticas: ocupação, turmas sem sala
├── services/
│   └── allocation.service.ts
├── stores/
│   └── allocation.store.ts
└── index.ts
```

> A view `AllocationView` é compartilhada com o Módulo 7 (Automática): a mesma grade exibe tanto as utilizações criadas manualmente quanto as geradas pelo algoritmo.

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:id/allocation` | `AllocationView` | `user` (edição), `admin` (leitura) |

---

## 6.1 Cronograma (`AllocationView`)

### Layout

- Breadcrumb: "Projetos / {nome} / Cronograma"
- Painel lateral esquerdo: `AllocationStats`
- Área principal: `ScheduleGrid`
- Botão "Adicionar utilização" na toolbar (visível para `user`)

### `ScheduleGrid`

Grade que representa o cronograma:
- Eixo X: horários (ex: segunda 08h, segunda 10h, ...)
- Eixo Y: salas (agrupadas por prédio)
- Células preenchidas: nome da turma + professor da utilização
- Células vazias: sala disponível naquele horário (clicáveis para adicionar)

Filtros sobre a grade:
- Por prédio
- Por tipo/atributo de sala
- Por dia da semana

### `AllocationStats`

| Métrica | Descrição |
|---------|-----------|
| Taxa de ocupação | % de slots utilizados |
| Turmas com sala | N de N total |
| Turmas sem utilização | N turmas ainda não alocadas |

---

## 6.2 Adicionar Utilização Manual

Ao clicar em "Adicionar utilização" ou numa célula vazia, abre `AllocationCreateModal`:

- Seleção da **turma** (dentre as turmas do projeto)
- Seleção da **sala**
- Seleção do **horário** (dia + faixa de tempo)
- Escopo da utilização:
  - **Semanal** — repete todo o semestre naquele horário
  - **Dia único** — ocorre apenas em uma data específica
- Detecção de conflito em tempo real:
  - Sala já ocupada no horário → exibe `AllocationConflictAlert` e desabilita "Confirmar"
  - Sala sem capacidade suficiente para a turma → exibe aviso (não bloqueia)
- "Confirmar" cria a utilização; "Cancelar" fecha sem alterar

---

## 6.3 Editar / Remover Utilização

Ao clicar numa célula preenchida, abre menu de ações:

| Ação | Descrição |
|------|-----------|
| Mover | Escolhe nova sala/horário para a utilização |
| Trocar | Seleciona outra utilização para trocar de posição |
| Remover | Remove a utilização (turma volta para "sem utilização") |

A detecção de conflito é verificada pelo servidor ao salvar. Se a API retornar `ALLOCATION_CONFLICT`, exibe toast de erro com detalhes.

---

## 6.4 Chamadas à API

```
GET    /projects/:id/allocations                  # Lista utilizações (cronograma)
POST   /projects/:id/allocations                  # Cria utilização manual
       Body: { turmaId, roomId, timeSlot, scope: 'weekly' | 'single', date? }
PATCH  /projects/:id/allocations/:allocationId    # Mover (roomId / timeSlot)
DELETE /projects/:id/allocations/:allocationId    # Remover utilização
```

---

## Critérios de Aceitação

- [ ] `user` visualiza o cronograma do projeto (salas × horários) com ocupado/livre
- [ ] `user` adiciona uma utilização escolhendo turma, sala e horário disponível
- [ ] É possível criar utilização de **dia único** (não só semanal)
- [ ] Tentativa de adicionar em sala já ocupada no horário é bloqueada com mensagem clara
- [ ] `user` consegue mover ou remover uma utilização existente
- [ ] Estatísticas de ocupação e de turmas sem utilização são exibidas
- [ ] `admin` vê o cronograma em somente leitura (sem ações de edição)
