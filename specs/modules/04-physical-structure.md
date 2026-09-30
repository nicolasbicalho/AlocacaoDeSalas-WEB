# Módulo 4 — Estrutura Física (Prédios e Salas)

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth), Módulo 2 (Institutes)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/04-physical-structure.md`](../../../AlocacaoDeSalas-API/specs/modules/04-physical-structure.md)

---

## Visão Geral

Telas para o `user` cadastrar e gerenciar **prédios** e **salas** do seu instituto — os dados que alimentam a alocação automática. As salas têm **características fixas** (lista `ROOM_FEATURES`), marcadas por checkboxes (`FeatureCheckboxes`). O `admin` visualiza (somente leitura).

Fase 1: cadastro manual (CRUD). Upload em massa (CSV/XLSX): fase 2.

---

## Estrutura dos Módulos

```
modules/building/
├── views/        # BuildingListView, BuildingCreateView, BuildingDetailView
├── components/   # BuildingForm
├── services/building.service.ts
└── index.ts

modules/room/
├── views/        # RoomListView, RoomCreateView, RoomDetailView
├── components/   # RoomForm
├── services/room.service.ts
└── index.ts

shared/components/
└── FeatureCheckboxes.vue   # checkboxes das características (compartilhado com Turmas)
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/buildings` | `BuildingListView` | `admin`, `user` |
| `/buildings/new` | `BuildingCreateView` | `user` |
| `/buildings/:id` | `BuildingDetailView` | `admin`, `user` |
| `/buildings/:buildingId/rooms` | `RoomListView` | `admin`, `user` |
| `/buildings/:buildingId/rooms/new` | `RoomCreateView` | `user` |
| `/rooms/:id` | `RoomDetailView` | `admin`, `user` |

Salas são listadas e criadas a partir do prédio (rota aninhada por `buildingId`).

---

## 4.1 Prédios

- **Lista**: tabela (Nome, Código, Status, Ações: Ver / Salas), busca por nome/código, botão "Novo prédio" (só `user`), estado vazio.
- **Form (`BuildingForm`)**: nome, código (uppercase automático), latitude/longitude opcionais.
- **Detalhe**: form em edição (`user`) ou somente leitura (`admin`); botão "Desativar" (`user`, com `AppConfirmDialog`); link para as salas do prédio.
- **Erros inline**: `BUILDING_CODE_EXISTS` → campo código.

## 4.2 Salas

- **Lista (por prédio)**: tabela (Nome, Código, Capacidade, Características, Status, Ações), "Nova sala" (`user`). A coluna Características mostra os rótulos das características da sala.
- **Form (`RoomForm`)**: nome, código, capacidade + **`FeatureCheckboxes`** (características da sala).
- **Detalhe**: edição/desativação (`user`), somente leitura (`admin`).
- **Erros inline**: `ROOM_CODE_EXISTS` → campo código.

### Características (`FeatureCheckboxes`)

Componente compartilhado (ver [ui-components.md](../shared/ui-components.md#featurecheckboxes)) com as 6 opções fixas de `ROOM_FEATURES`:

| Valor | Rótulo |
|-------|--------|
| `projetor` | Projetor |
| `ar_condicionado` | Ar-condicionado |
| `acessibilidade` | Acessibilidade (PcD) |
| `computadores` | Computadores (lab. de informática) |
| `som` | Sistema de som |
| `bancadas` | Bancadas (lab. experimental) |

O `RoomForm` envia a seleção como `features: RoomFeature[]` no payload. Substitui o antigo `RoomAttributesEditor` (chave-valor), que deixou de existir.

> **Migração (dev):** salas antigas com `attributes` são convertidas para `features` na API pelo script `AlocacaoDeSalas-API/scripts/migrations/001-dates-features-events.js`.

---

## Critérios de Aceitação

- [x] `user` cria/edita/desativa prédios e salas do seu instituto
- [x] O form de sala marca as características por checkboxes (6 opções fixas)
- [x] A lista de salas mostra as características de cada sala
- [x] `admin` vê prédios e salas em somente leitura
- [x] Código duplicado (prédio ou sala) exibe erro inline no campo correto
- [x] Salas são acessadas a partir do prédio (rota aninhada)
