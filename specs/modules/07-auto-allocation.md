# Módulo 7 — Alocação Automática

**Status:** `draft`
**Depende de:** Módulo 6 (Alocação Manual e Cronograma)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/07-auto-allocation.md`](../../../AlocacaoDeSalas-API/specs/modules/07-auto-allocation.md)

> **Ordem de desenvolvimento:** implementado **após** a alocação manual (Módulo 6). Reutiliza a entidade **evento** e a visão de **cronograma** definidas lá — aqui um algoritmo gera eventos em lote.

> **Planejado — feedback do gerente (2026-10):** critérios e ordem de processamento revistos ("exigências raras primeiro, depois turmas menores primeiro"). Fase 5 do [plano](../../../AlocacaoDeSalas-API/specs/plans/2026-10-plano-feedback-gerente.md).

---

## Visão Geral

O `user` executa a alocação automática de turmas em salas dentro de um projeto ativo. O **processamento automático preenche o cronograma do semestre** — gera os **eventos recorrentes** das turmas nos horários da `schedule` que ainda não têm sala — sem conflitos de horário e respeitando os eventos já lançados manualmente. Eventos **únicos** são sempre manuais.

O resultado popula a mesma grade do Módulo 6. Depois de gerado, o cronograma pode ser refinado manualmente (mover, remover ou adicionar eventos). A tela exibe o progresso da execução e as turmas não alocadas (se existirem).

Critérios do algoritmo (detalhados na [API 07](../../../AlocacaoDeSalas-API/specs/modules/07-auto-allocation.md)):

**Restrições obrigatórias:**
- Sem conflito de sala e sem conflito de turma
- Capacidade: `capacity >= studentCount`
- Requisitos: características da sala incluem as exigidas pela turma (`features ⊇ requiredFeatures`)
- Manual primeiro: eventos lançados manualmente são mantidos; o automático preenche o restante
- Só gera eventos recorrentes de turmas

**Preferências, por prioridade:**
1. **Evitar desperdício** — a sala de menor capacidade que comporte a turma (best fit)
2. **Requisitos** — verificados como filtro de salas (restrição acima), não como pontuação
3. **Menor deslocamento** — turmas do mesmo período (mesmo grupo de alunos) em horários próximos não devem percorrer grandes distâncias (distância entre prédios por latitude/longitude). Depende de um campo futuro na turma (ex.: `period`), ainda não implementado.

**Desempate:** mesma turma/professor em horários consecutivos prefere a mesma sala/prédio.

---

## Estrutura do Módulo

Compartilhado com o Módulo 6 — usa a mesma `AllocationView` e `ScheduleGrid`.

Componentes adicionais específicos da execução automática:

```
modules/allocation/
└── components/
    ├── AllocationRunPanel.vue     # Painel de execução da alocação automática
    └── UnallocatedClassList.vue   # Lista de turmas sem sala + motivo
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:id/allocation` | `AllocationView` | `user` (execução), `admin` (leitura) |

A mesma `AllocationView` do Módulo 6 — o painel de execução automática aparece para `user` quando o projeto está `active`.

---

## 7.1 Execução (`AllocationRunPanel`)

Visível apenas para `user`.

- Status atual: "Não executada" | "Em andamento" | "Concluída"
- Botão "Gerar cronograma automático" (desabilitado se o projeto não tem turmas/salas)
- Botão "Re-executar" após a primeira geração (abre confirmação — refaz os eventos gerados automaticamente; eventos manuais são mantidos)

### Comportamento

1. Ao montar, carrega o cronograma existente via `GET /projects/:id/allocations`
2. `user` clica "Gerar" → confirmação se já existe cronograma
3. Chama `POST /projects/:id/allocation/run`
4. A API processa de forma síncrona (MVP) — exibe spinner e desabilita o botão
5. Recebe o resultado, atualiza a grade e as estatísticas
6. Se há turmas não alocadas, `UnallocatedClassList` é exibida com os motivos

---

## 7.2 Chamadas à API

```
GET  /projects/:id/allocations       # Cronograma existente
POST /projects/:id/allocation/run    # Gera o cronograma completo do semestre
```

Response de `/run`:
```json
{
  "success": true,
  "data": {
    "allocated": 95,
    "unallocated": 3,
    "occupancyRate": 0.72,
    "allocations": [ ... ],
    "unallocatedClasses": [
      { "turmaId": "...", "turmaName": "...", "reason": "Sem sala com capacidade suficiente" }
    ]
  }
}
```

---

## Critérios de Aceitação

- [ ] Alocação automática gera os eventos recorrentes do semestre e popula a grade
- [ ] Eventos lançados manualmente permanecem inalterados após a execução
- [ ] Estatísticas de ocupação são exibidas corretamente
- [ ] Turmas não alocadas são listadas com o motivo
- [ ] Re-executar solicita confirmação antes de refazer os eventos automáticos
- [ ] Após a geração, o cronograma pode ser ajustado manualmente (Módulo 6)
- [ ] `admin` vê o cronograma em somente leitura (sem painel de execução)
- [ ] Grade suporta filtro por prédio e navegação por data (Módulo 6)

---

## Questões em aberto
- Re-execução sem apagar eventos manuais exige distinguir eventos automáticos dos manuais na API — ver [API 07 — Questões em aberto](../../../AlocacaoDeSalas-API/specs/modules/07-auto-allocation.md#questões-em-aberto).
- Campo de período/curso da turma (pré-requisito do critério de menor deslocamento) — ainda não implementado.
