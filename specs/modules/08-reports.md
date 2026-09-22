# Módulo 7 — Relatórios e Exportação

**Status:** `draft`
**Depende de:** Módulo 5 (Auto Allocation)
**API correspondente:** `AlocacaoDeSalas-API/specs/modules/07-reports.md` (a ser criado)

---

## Visão Geral

Exibe relatórios de ocupação, grades por sala e por professor, além da exportação dos dados em diferentes formatos. Acessível por `coordinator` e `professor` (somente leitura). `admin` não acessa relatórios de projetos diretamente.

---

## Estrutura do Módulo

```
modules/report/
├── views/
│   └── ReportView.vue
├── components/
│   ├── OccupancyChart.vue         # Gráfico de taxa de ocupação por sala
│   ├── RoomScheduleTable.vue      # Grade de horários por sala
│   ├── ProfessorScheduleTable.vue # Grade de horários por professor
│   └── ExportPanel.vue            # Opções de exportação
├── services/
│   └── report.service.ts
└── index.ts
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/projects/:id/reports` | `ReportView` | `coordinator`, `professor` |

---

## 7.1 Tela de Relatórios (`ReportView`)

### Layout

- Breadcrumb: "Projetos / {nome} / Relatórios"
- Tabs de navegação: "Ocupação" | "Grade por Sala" | "Grade por Professor"
- Painel de exportação no canto superior direito

---

## 7.2 Tab — Ocupação

### Componentes

- `AllocationStats` (reutilizado do módulo 5): totais de alocação, taxa de ocupação global
- `OccupancyChart`: gráfico de barras horizontais — uma barra por sala, mostrando % de ocupação
  - Cores: verde (≥ 70%), amarelo (40–69%), vermelho (< 40%)
- Filtro por prédio

### Chamada à API

```
GET /projects/:id/reports/occupancy?buildingId=...
```

---

## 7.3 Tab — Grade por Sala

### Componentes

- Seletor de sala (dropdown ou busca)
- `RoomScheduleTable`: tabela com dias da semana nas colunas e horários nas linhas
  - Cada célula: nome da turma + professor (ou vazia)

### Chamada à API

```
GET /projects/:id/reports/room-schedule?roomId=...
```

---

## 7.4 Tab — Grade por Professor

### Componentes

- Seletor de professor (dropdown ou busca)
- `ProfessorScheduleTable`: mesma estrutura que `RoomScheduleTable`
  - Cada célula: nome da turma + sala alocada

### Chamada à API

```
GET /projects/:id/reports/professor-schedule?professorId=...
```

---

## 7.5 Exportação (`ExportPanel`)

### Formatos disponíveis

| Formato | Conteúdo |
|---------|----------|
| `.xlsx` | Todas as alocações do projeto em planilha |
| `.csv` | Mesmo conteúdo em CSV |
| `.pdf` | Relatório formatado (grade completa por sala) |

### Comportamento

1. Usuário clica no formato desejado
2. Botão exibe loading enquanto gera o arquivo
3. Download inicia automaticamente via blob ou redirect para URL assinada
4. Erro exibe toast

### Chamadas à API

```
GET /projects/:id/reports/export?format=xlsx
GET /projects/:id/reports/export?format=csv
GET /projects/:id/reports/export?format=pdf
```

Response: arquivo binário com header `Content-Disposition: attachment; filename=...`

---

## Critérios de Aceitação

- [ ] Gráfico de ocupação exibe corretamente por sala
- [ ] Grade por sala filtra por sala selecionada
- [ ] Grade por professor filtra por professor selecionado
- [ ] Export `.xlsx` faz download do arquivo correto
- [ ] Export `.csv` faz download do arquivo correto
- [ ] Professor vê todos os relatórios sem restrições de leitura
- [ ] Tab de ocupação exibe estado vazio quando não há alocações no projeto
