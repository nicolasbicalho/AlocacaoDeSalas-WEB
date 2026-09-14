# Módulo 4 — Estrutura Física (Prédios e Salas)

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth), Módulo 2 (Institutes)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/04-physical-structure.md`](../../../AlocacaoDeSalas-API/specs/modules/04-physical-structure.md)

---

## Visão Geral

Telas para o `user` cadastrar e gerenciar **prédios** e **salas** do seu instituto — os dados que alimentam a alocação automática. As salas têm características **flexíveis** (chave-valor), com um editor dinâmico de atributos. O `admin` visualiza (somente leitura).

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
├── components/   # RoomForm, RoomAttributesEditor
├── services/room.service.ts
└── index.ts
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

- **Lista (por prédio)**: tabela (Nome, Código, Capacidade, nº de atributos, Status, Ações), "Nova sala" (`user`).
- **Form (`RoomForm`)**: nome, código, capacidade + **`RoomAttributesEditor`**.
- **Detalhe**: edição/desativação (`user`), somente leitura (`admin`).
- **Erros inline**: `ROOM_CODE_EXISTS` → campo código.

### `RoomAttributesEditor`

Editor de lista dinâmica de características. Cada linha = `{ key, value }`:
- Campo `key` (slug da característica, ex.: `projector`, `accessible`, `computers`).
- Seletor de tipo do valor: **texto** / **número** / **sim-não** — refletindo `string | number | boolean`.
- Campo `value` conforme o tipo.
- Botões adicionar/remover linha. Valida chave não vazia e única.

O componente emite a lista de atributos para o `RoomForm`, que a envia no payload.

---

## Critérios de Aceitação

- [x] `user` cria/edita/desativa prédios e salas do seu instituto
- [x] O editor de atributos permite adicionar N características com tipos variados (texto/número/sim-não)
- [x] `admin` vê prédios e salas em somente leitura
- [x] Código duplicado (prédio ou sala) exibe erro inline no campo correto
- [x] Salas são acessadas a partir do prédio (rota aninhada)
