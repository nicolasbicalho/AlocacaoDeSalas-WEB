# Módulo 5 — Alocação Automática

**Status:** `draft`
**Depende de:** Módulo 4 (Data Upload)
**API correspondente:** `AlocacaoDeSalas-API/specs/modules/05-auto-allocation.md` (a ser criado)

---

## Visão Geral

O coordinator executa a alocação automática de turmas em salas dentro de um projeto ativo. O algoritmo distribui as turmas sem conflitos de horário, respeitando capacidade, tipo de sala, recursos e distância entre prédios. A tela exibe o progresso da execução e o resultado — incluindo turmas não alocadas (se existirem).

---

## Estrutura do Módulo

```
modules/allocation/
├── views/
│   └── AllocationView.vue         # View principal (compartilhada com módulo 6)
├── components/
│   ├── AllocationRunPanel.vue     # Painel de execução da alocação automática
│   ├── AllocationResultGrid.vue   # Grade visual de alocações por sala/horário
│   ├── AllocationStats.vue        # Estatísticas: % ocupação, conflitos, não alocadas
│   └── UnallocatedClassList.vue   # Lista de turmas sem sala
├── services/
│   └── allocation.service.ts
├── stores/
│   └── allocation.store.ts
└── index.ts
```

> O módulo `allocation/` é compartilhado com o Módulo 6 (Manual). A mesma view (`AllocationView`) suporta ambos os modos.

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:id/allocation` | `AllocationView` | `coordinator`, `professor` |

---

## 5.1 Tela de Alocação (`AllocationView`)

### Layout

- Breadcrumb: "Projetos / {nome} / Alocação"
- Painel lateral esquerdo: `AllocationRunPanel` + `AllocationStats`
- Área principal: `AllocationResultGrid`
- Abaixo do grid: `UnallocatedClassList` (exibido apenas se houver turmas sem sala)

### `AllocationRunPanel`

Visível apenas para `coordinator`.

- Status atual da alocação: "Não executada" | "Em andamento" | "Concluída"
- Botão "Executar alocação automática" (desabilitado se projeto não tem dados importados)
- Botão "Re-executar" após primeira execução (abre confirmação — sobrescreve resultado anterior)

### `AllocationResultGrid`

Grade com:
- Eixo X: horários (ex: segunda 08h, segunda 10h, ...)
- Eixo Y: salas (agrupadas por prédio)
- Células: nome da turma alocada + professor
- Células vazias: sala disponível naquele horário
- Cores por tipo de sala (sala de aula, laboratório, auditório)

Filtros sobre o grid:
- Por prédio
- Por tipo de sala
- Por horário (dia da semana)

### `AllocationStats`

| Métrica | Descrição |
|---------|-----------|
| Taxa de ocupação | % de slots utilizados |
| Turmas alocadas | N de N total |
| Conflitos | Deve ser sempre 0 após alocação automática |
| Turmas não alocadas | N turmas sem sala |

### Comportamento

1. Ao montar, verifica se já existe resultado de alocação via `GET /projects/:id/allocation`
2. Se existe, exibe o grid populado
3. Coordinator clica "Executar" → abre confirmação se já existe resultado anterior
4. Após confirmação, chama `POST /projects/:id/allocation/run`
5. A API processa de forma síncrona (MVP) — enquanto aguarda, exibe spinner e desabilita o botão
6. Recebe o resultado e atualiza o grid e as estatísticas
7. Se há turmas não alocadas, `UnallocatedClassList` é exibida com os motivos

### Chamadas à API

```
GET /projects/:id/allocation           # Busca resultado existente
POST /projects/:id/allocation/run      # Executa alocação automática
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
      { "classId": "...", "className": "...", "reason": "Sem sala com capacidade suficiente" }
    ]
  }
}
```

---

## Critérios de Aceitação

- [ ] Alocação automática executa e exibe o grid resultado
- [ ] Estatísticas de ocupação são exibidas corretamente
- [ ] Turmas não alocadas são listadas com o motivo
- [ ] Re-executar solicita confirmação antes de sobrescrever
- [ ] Professor vê o grid em somente leitura (sem painel de execução)
- [ ] Grid suporta filtro por prédio e dia da semana
