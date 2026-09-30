# Módulo 10 — Página Inicial (Dashboard)

**Status:** `implemented`
**Depende de:** Módulo 3 (Projects), Módulo 5 (Turmas), Módulo 6 (Alocação Manual e Cronograma), Módulo 9 (Auditoria)
**API correspondente:** nenhuma específica — compõe endpoints já existentes (ver 10.3)

---

## Visão Geral

Página exibida após o login (`/dashboard`). Responde, **por perfil**, "em que pé está o trabalho e o que falta fazer", com atalhos para agir. Não substitui os relatórios (Módulo 8): mostra só o que é acionável na hora.

- **`user` (gerente):** painel do **projeto ativo** do instituto — andamento do semestre, progresso da alocação, pendências e próximos eventos únicos.
- **`admin`:** visão da **plataforma** — contadores, institutos sem projeto ativo e atividade recente (auditoria).

---

## Estrutura do Módulo

```
modules/dashboard/
├── views/
│   └── DashboardView.vue        # saudação + escolhe o painel pelo role
├── components/
│   ├── UserDashboard.vue        # painel do gerente
│   ├── AdminDashboard.vue       # painel do admin
│   └── StatCard.vue             # número + rótulo (opcionalmente um link)
├── services/
│   └── dashboard.service.ts     # loadUserDashboard / loadAdminDashboard
├── helpers.ts                   # cálculos puros (testados em helpers.test.ts)
└── index.ts
```

---

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/dashboard` | `DashboardView` | `admin`, `user` |

---

## 10.1 Painel do gerente (`UserDashboard`)

### Sem projeto ativo
- Se há rascunho: "O projeto *X* está em rascunho. Ative-o…" + **Abrir projeto**.
- Se não há nenhum projeto: "Comece pelo projeto do semestre" + **Criar projeto**.

### Com projeto ativo
1. **Card do projeto:** nome, status, período (`startDate`–`endDate`) e atalhos **Abrir cronograma**, **Ver turmas**, **Nova turma**. Andamento do semestre:
   - antes do início: "O semestre começa em *N* dia(s)";
   - durante: "Semana *X* de *Y*" + barra de progresso;
   - depois do fim: "O semestre terminou há *N* dia(s). Encerre o projeto…".
2. **Progresso da alocação:** "*C* de *T* horários de turma já têm sala" + barra (verde a 100%). Contadores: turmas ativas, salas ativas e **salas sem aula fixa** (sem nenhum evento recorrente).
3. **Pendências** (clicáveis):
   - cada horário da grade de uma turma sem sala → **Alocar →**: abre o cronograma na próxima data daquele dia da semana, com o modal já preenchido (turma, dia, início e fim — falta só a sala);
   - turmas sem horários na grade → **Editar →** (detalhe da turma);
   - sem pendências: "✓ Todos os horários das turmas já têm sala".
4. **Próximos eventos únicos:** até 5, a partir de hoje (ou do início do semestre, se ainda não começou), com a cor do evento; o clique leva a grade até o evento e o destaca.

### Regra de cobertura
Um horário `{ day, start, end }` da grade da turma está **coberto** quando existe um evento **recorrente** da própria turma no mesmo dia da semana que abrange o horário inteiro (`evento.start ≤ start` e `evento.end ≥ end`). Eventos únicos não contam — reposições não resolvem a grade semanal. Turmas inativas são ignoradas.

---

## 10.2 Painel do admin (`AdminDashboard`)

- **Contadores:** institutos **ativos** (link para `/institutes`), usuários cadastrados, projetos ativos / em rascunho / encerrados.
- **Sem projeto ativo:** institutos ativos que ainda não têm projeto `active` (link para o instituto); ou "✓ Todos os institutos têm um projeto ativo".
- **Atividade recente:** as 8 últimas ações da auditoria (tempo relativo, usuário, ação, entidade) + **Ver auditoria completa →**.

---

## 10.3 Dados (composição de endpoints existentes)

```
# gerente
GET /projects?limit=100                       → projeto ativo + rascunhos
GET /turmas?projectId=:id&limit=100
GET /rooms?limit=100
GET /projects/:id/allocations

# admin
GET /institutes?limit=100
GET /users?limit=1                            → só pagination.total
GET /projects?status=active|draft|closed      → pagination.total (e institutos com ativo)
GET /audit-logs?limit=8
```

Os cálculos são feitos no cliente, o que é adequado à escala do sistema (dezenas de turmas/salas por instituto). Se o volume crescer, um endpoint de resumo no servidor (`GET /dashboard/summary`) é a evolução natural.

### Deep link no cronograma
Os links do painel usam query params lidos pela `AllocationView` (ver Módulo 6): `?event=<id>`, `?date=YYYY-MM-DD` e `?turma=<id>&start=HH:MM&end=HH:MM`.

---

## Critérios de Aceitação

- [x] Após o login, `admin` e `user` veem painéis diferentes
- [x] Gerente sem projeto ativo é orientado a ativar o rascunho ou criar um projeto
- [x] Card do projeto mostra o período e o andamento do semestre (antes / durante / depois)
- [x] Progresso da alocação conta os horários da grade das turmas cobertos por evento recorrente
- [x] Pendência "sem sala" abre o cronograma com o modal preenchido para aquele horário
- [x] Próximo evento único leva a grade até o evento, com destaque
- [x] Admin vê contadores, institutos ativos sem projeto ativo e as últimas ações da auditoria
- [x] Dark mode em todo o módulo
