# Módulo 6 — Alocação Manual e Ajustes

**Status:** `draft`
**Depende de:** Módulo 5 (Auto Allocation)
**API correspondente:** `AlocacaoDeSalas-API/specs/modules/06-manual-allocation.md` (a ser criado)

---

## Visão Geral

Após a alocação automática, o coordinator pode fazer ajustes manuais: mover uma turma para outra sala, trocar duas alocações de sala, fixar uma alocação (impede que re-execução automática a altere) ou remover uma alocação. O sistema detecta conflitos em tempo real durante os ajustes.

---

## Estrutura do Módulo

Compartilhado com o módulo 5 — usa os mesmos componentes de `modules/allocation/`.

Componentes adicionais específicos de ajuste manual:

```
modules/allocation/
└── components/
    ├── AllocationEditModal.vue     # Modal para mover/trocar alocação
    ├── AllocationConflictAlert.vue # Alerta inline de conflito detectado
    └── AllocationPinBadge.vue      # Indicador visual de alocação fixada
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:id/allocation` | `AllocationView` | `coordinator` (modo edição ativo) |

A mesma `AllocationView` do módulo 5 — o modo de edição manual é ativado quando o coordinator acessa a view com projeto no status `active`.

---

## 6.1 Modo de Edição Manual

### Ativação

- O grid exibe células clicáveis quando o coordinator está autenticado e o projeto está `active`
- Um toggle "Modo de ajuste" na toolbar ativa/desativa a interação de edição
- Professor sempre vê o grid em somente leitura

### Interações sobre uma célula (alocação existente)

Ao clicar em uma célula preenchida, abre um menu de ações:

| Ação | Descrição |
|------|-----------|
| Mover | Escolhe nova sala/horário para a turma |
| Trocar | Seleciona outra alocação para trocar de posição |
| Fixar / Desafixar | Marca como fixada (não pode ser alterada por re-execução automática) |
| Remover | Remove a alocação (turma volta para não alocada) |

### `AllocationEditModal`

Aberto ao escolher "Mover":

- Dropdown de seleção de sala disponível no mesmo horário
- Detecção de conflito em tempo real:
  - Se a sala selecionada já tem outra turma no horário: exibe `AllocationConflictAlert` e desabilita "Confirmar"
  - Se a sala não tem capacidade suficiente: exibe aviso (não bloqueia)
- Botão "Confirmar" salva o ajuste
- Botão "Cancelar" fecha o modal sem alterar

### Alocações Fixadas

- Exibem `AllocationPinBadge` (ícone de pin) no canto da célula
- Tooltip: "Alocação fixada — não será alterada por re-execução automática"

### Detecção de Conflito

Verificada pelo servidor ao salvar — o frontend não valida isso de forma antecipada (exceto na checagem de disponibilidade no modal). Se a API retornar `ALLOCATION_CONFLICT`, exibe toast de erro com detalhes.

---

## 6.2 Chamadas à API

```
PATCH /projects/:id/allocations/:allocationId/move
Body: { roomId, timeSlot }

PATCH /projects/:id/allocations/:allocationId/swap
Body: { targetAllocationId }

PATCH /projects/:id/allocations/:allocationId/pin
PATCH /projects/:id/allocations/:allocationId/unpin

DELETE /projects/:id/allocations/:allocationId
```

---

## Critérios de Aceitação

- [ ] Coordinator consegue mover uma turma para sala disponível no mesmo horário
- [ ] Tentativa de mover para sala com conflito é bloqueada com mensagem clara
- [ ] Troca de duas alocações mantém integridade sem conflitos
- [ ] Alocação fixada exibe indicador visual e não é alterada por re-execução automática
- [ ] Remoção de alocação move a turma para a lista "Não alocadas"
- [ ] Professor não vê opções de edição
- [ ] Re-execução automática após ajustes manuais mantém as alocações fixadas
