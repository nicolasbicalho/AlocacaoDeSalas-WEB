# Módulo 7 — Alocação Automática

**Status:** `draft`
**Depende de:** Módulo 6 (Alocação Manual e Cronograma)
**API correspondente:** `AlocacaoDeSalas-API/specs/modules/07-auto-allocation.md` (a ser criado)

> **Ordem de desenvolvimento:** implementado **após** a alocação manual (Módulo 6). Reutiliza a entidade de **utilização** e a visão de **cronograma** definidas lá — aqui um algoritmo as gera em lote.

---

## Visão Geral

O `user` executa a alocação automática de turmas em salas dentro de um projeto ativo. O **processamento automático gera o cronograma completo do projeto** — todas as utilizações de salas ao longo do semestre inteiro — sem conflitos de horário, respeitando capacidade, atributos/recursos de sala e distância entre prédios.

O resultado popula a mesma grade do Módulo 6. Depois de gerado, o cronograma pode ser refinado manualmente (mover, trocar, remover ou adicionar utilizações). A tela exibe o progresso da execução e as turmas não alocadas (se existirem).

Critérios considerados pelo algoritmo (ver Módulo 4 — Estrutura Física):
1. Tamanho da turma × capacidade da sala
2. Atributos/recursos exigidos pela turma × atributos da sala
3. Acessibilidade da sala
4. Aulas consecutivas de um mesmo professor na mesma sala / prédios próximos

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
- Botão "Re-executar" após a primeira geração (abre confirmação — sobrescreve o cronograma anterior)

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

- [ ] Alocação automática gera o cronograma do semestre e popula a grade
- [ ] Estatísticas de ocupação são exibidas corretamente
- [ ] Turmas não alocadas são listadas com o motivo
- [ ] Re-executar solicita confirmação antes de sobrescrever
- [ ] Após a geração, o cronograma pode ser ajustado manualmente (Módulo 6)
- [ ] `admin` vê o cronograma em somente leitura (sem painel de execução)
- [ ] Grade suporta filtro por prédio e dia da semana
