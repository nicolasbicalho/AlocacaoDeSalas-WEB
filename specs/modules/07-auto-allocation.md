# Módulo 7 — Alocação Automática

**Status:** `implemented` — fase 5 do [plano do feedback do gerente](../../../AlocacaoDeSalas-API/specs/plans/2026-10-plano-feedback-gerente.md) (2026-10-12).
**Depende de:** Módulo 6 (Alocação Manual e Cronograma)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/07-auto-allocation.md`](../../../AlocacaoDeSalas-API/specs/modules/07-auto-allocation.md) — critérios, ordem de processamento, pontuação, motivos e contrato.

> **O que mudou em relação ao rascunho:** em vez de "gerar e pronto", o gerente **simula**, confere e só então **aplica**; os eventos gerados ficam **marcados como automáticos**, para "refazer" ou "remover automáticas" sem tocar no que foi lançado à mão; há uma **comparação de estratégias** (a do gerente × "maiores primeiro") para o TCC.

---

## Visão Geral

No Cronograma, o `user` abre o painel **Alocação automática**, simula e vê o que seria alocado e o que ficaria sem sala (com o motivo). Se estiver bom, aplica: os eventos recorrentes aparecem na grade, marcados como automáticos, e continuam editáveis como qualquer evento (Módulo 6). `admin` vê o cronograma, mas não o painel.

Em resumo, o algoritmo (detalhes na API):
- só preenche **o que falta**: horários de turma sem sala, em cada papel (teórica e, com aula prática, prática);
- **nunca** quebra capacidade (turma inteira, nas duas salas) nem as características exigidas — diferente do manual, onde são avisos;
- **pula** turmas com nº de alunos "a definir";
- ordem do gerente (D6): **exigências raras primeiro, depois as turmas menores**;
- escolhe a sala como a sugestão de salas da fase 2 (encaixe + preferências do professor), preferindo manter a mesma turma na mesma sala ao longo da semana.

---

## 7.1 Painel `AutoAllocationPanel`

Seção recolhível no topo do Cronograma (entre os indicadores e a faixa da semana), visível para `user` com projeto não encerrado.

- **Estratégia:** "Do gerente — exigências raras, depois as menores" (padrão) | "Maiores primeiro (comparação)".
- **"Refazer as automáticas"** (caixa; aparece quando já há eventos automáticos): recalcula ignorando os automáticos atuais, que são substituídos ao aplicar. Os manuais nunca mudam.
- Botões:
  - **Simular** → `POST …/allocations/auto/preview`; mostra o resultado (7.2) sem gravar;
  - **Comparar estratégias** → `POST …/allocations/auto/compare`; mostra a tabela de 7.3;
  - **Remover automáticas (N)** → confirmação → `DELETE …/allocations/auto`; recarrega a grade.
- Texto curto de ajuda: "O automático só preenche horários sem sala. Eventos lançados à mão ficam como estão; editar um evento automático o torna manual."

## 7.2 Resultado `AutoAllocationResult`

- **Indicadores:** alocados / demandas, sem sala, turmas puladas, lugares desperdiçados, ocupação média, preferências atendidas (x de y), salas grandes demais.
- **Ficam sem sala · turmas puladas** (sempre visível quando houver; o título traz as duas contagens): turma, papel (se a turma tem prática), dia e horário, **motivo em português** e **"Alocar →"** (o mesmo atalho do dashboard, que abre o modal manual já preenchido). Turmas puladas aparecem com "Sem nº de alunos — preencher na aba Turmas →".
- **Vai alocar** (recolhível): turma, papel, dia e horário, sala e selos das preferências (✓/✗/? como na sugestão de salas).
- Ações: **Aplicar (N eventos)** → `POST …/allocations/auto` (o servidor recalcula; o resultado mostrado passa a ser o aplicado) → toast, grade e indicadores recarregados. **Descartar** fecha o resultado.

Motivos (`reason`) → texto:

| Código | Texto |
|--------|-------|
| `NO_STUDENT_COUNT` | Sem nº de alunos (a capacidade não pode ser conferida) |
| `NO_ROOM_WITH_FEATURES` | Nenhuma sala tem as características exigidas |
| `NO_ROOM_WITH_CAPACITY` | Nenhuma sala com as características comporta a turma |
| `ALL_OCCUPIED` | Todas as salas compatíveis estão ocupadas nesse horário |
| `TURMA_BUSY` | A turma já tem outro evento desse papel nesse horário |

## 7.3 Comparação de estratégias

Tabela "métrica × estratégia" (do gerente | maiores primeiro), com a melhor de cada linha destacada: alocados, sem sala, lugares desperdiçados, ocupação média, preferências atendidas, salas grandes demais. Serve de evidência para o TCC — mesmos dados, só a ordem muda. Não grava nada.

## 7.4 Grade

Eventos com `source: 'auto'` mostram **"Automática"** no subtítulo do bloco (junto de horário, papel e professor) e a legenda ganha a nota "Automática = gerada pela alocação automática". Editar um desses eventos o torna manual (a marca some).

---

## Chamadas à API

```
POST   /projects/:projectId/allocations/auto/preview   # simular  { strategy, replaceAuto }
POST   /projects/:projectId/allocations/auto           # aplicar  { strategy, replaceAuto }
POST   /projects/:projectId/allocations/auto/compare   # comparar { replaceAuto }
DELETE /projects/:projectId/allocations/auto           # remover os automáticos
```

---

## Arquivos

### WEB — criados
| Arquivo | Conteúdo |
|---------|----------|
| `src/modules/allocation/components/AutoAllocationPanel.vue` | Painel (7.1): estratégia, refazer, simular, comparar, remover; controla o estado da execução |
| `src/modules/allocation/components/AutoAllocationResult.vue` | Resultado (7.2) e comparação (7.3): indicadores, sem sala com "Alocar →", plano, aplicar/descartar |
| `src/modules/allocation/autoAllocation.ts` | Textos dos motivos e das estratégias, formatação das métricas, link "Alocar" de uma demanda não atendida |
| `src/modules/allocation/autoAllocation.test.ts` | Testes dos textos, da formatação e dos links |

### WEB — modificados
| Arquivo | Mudança |
|---------|---------|
| `src/types/index.ts` | `IAllocation.source`; tipos `AutoStrategy`, `AutoAllocationResult`, `AutoAllocationMetrics`, `UnallocatedReason`; `AuditAction` com `auto_allocate` |
| `src/modules/allocation/services/allocation.service.ts` | `previewAutoAllocation`, `applyAutoAllocation`, `compareAutoAllocation`, `clearAutoAllocation` |
| `src/modules/allocation/views/AllocationView.vue` | inclui o painel (só `user`, projeto não encerrado) e recarrega a grade depois de aplicar/remover |
| `src/modules/allocation/components/ScheduleGrid.vue` | "Automática" no subtítulo dos eventos `source: 'auto'` |
| `src/modules/audit/labels.ts` | rótulo "Alocação automática" para `auto_allocate` |

### Specs atualizadas
`modules/06-manual-allocation.md` (marca "Automática" na grade e PATCH que a remove), `modules/09-audit.md` e `README.md`.

---

## Critérios de Aceitação

- [x] Painel visível só para `user` com projeto não encerrado; `admin` vê a grade sem o painel
- [x] Simular mostra indicadores, o que vai alocar e o que fica sem sala (com motivo em português), sem gravar
- [x] Aplicar grava, recarrega a grade e mostra o resultado aplicado
- [x] Demandas sem sala têm "Alocar →" para resolver à mão; turmas puladas apontam para a aba Turmas
- [x] "Refazer as automáticas" substitui só os automáticos; "Remover automáticas" pede confirmação e mantém os manuais
- [x] Comparação das duas estratégias em tabela, sem gravar
- [x] Eventos automáticos aparecem como "Automática" na grade; editar um deles o torna manual
- [x] Dark mode em todos os elementos novos
