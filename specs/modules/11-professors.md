# Módulo 11 — Professores

**Status:** `implemented`
**Depende de:** Módulo 1 (Auth), Módulo 5 (Turmas)
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/11-professors.md`](../../../AlocacaoDeSalas-API/specs/modules/11-professors.md)
**Origem:** fase 2 do [plano do feedback do gerente](../../../AlocacaoDeSalas-API/specs/plans/2026-10-plano-feedback-gerente.md) (D5: as preferências de sala são **do professor**).

---

## Visão Geral

Cadastro dos professores do instituto com as **preferências de sala** de cada um: quadros (mínimo), andares preferidos e se evita a extremidade do corredor. O gerente configura uma vez e as preferências valem em todos os semestres.

As preferências **não bloqueiam** alocações: só colocam as salas que atendem o professor no topo das **sugestões de sala** do cronograma ([06](./06-manual-allocation.md#sugestão-de-salas)).

> Professor **não é usuário do sistema** (não há role de login). Quem mantém o cadastro é o `user` (gerente); `admin` só visualiza.

---

## Estrutura do Módulo

```
modules/professor/
├── views/        # ProfessorListView, ProfessorCreateView, ProfessorDetailView
├── components/   # ProfessorForm
├── services/professor.service.ts
├── helpers.ts    # preferenceItems, parseFloors, formatFloors, nameKey (+ helpers.test.ts)
└── index.ts
```

## Rotas

| Path | View | Roles |
|------|------|-------|
| `/professors` | `ProfessorListView` | `admin`, `user` |
| `/professors/new` | `ProfessorCreateView` | `user` |
| `/professors/:professorId` | `ProfessorDetailView` | `admin`, `user` |

Item **"Professores"** no menu superior (os dois roles), depois de "Prédios".

---

## 11.1 Lista
- Título e explicação curta ("cadastro do instituto, válido em todos os semestres…"); botão "Novo professor" (`user`).
- Busca por nome (debounce de 300 ms) e caixa **"Mostrar desativados"** (por padrão, só ativos).
- Colunas: **Nome** (📝 quando há anotações), **Preferências de sala** (pílulas: "Térreo ou 1º andar", "≥ 2 quadros", "evita extremidade do corredor"; ou "sem preferências"), Status, Ver.
- Ordem alfabética do português, vinda da API.

## 11.2 Form (`ProfessorForm`)
- **Nome** (obrigatório).
- **Preferências de sala**, todas opcionais (em branco = sem preferência):
  - **Quadros (mínimo)** — inteiro de 1 a 20;
  - **Andares preferidos** — números separados por vírgula, `0` = térreo (ex.: "0, 1");
  - **Evita sala na extremidade do corredor** (caixa de seleção).
- Prévia em pílulas de como as preferências aparecem nas sugestões.
- **Anotações** (texto livre).
- Envia sempre o objeto inteiro: `{ name, preferences: { minBoards: number | null, floors: number[], avoidCorridorEnd: boolean }, notes }`.
- Erro inline: `PROFESSOR_NAME_EXISTS` → campo nome ("acentos e maiúsculas não diferenciam").

## 11.3 Detalhe
- Breadcrumb `Professores › {nome}`, título com status.
- `ProfessorForm` em edição (`user`) ou somente leitura (`admin`). Renomear avisa que o nome mudou também nas turmas.
- **Turmas do professor** em todos os semestres (`GET /turmas?professorId=`), com link para cada turma e o nome do projeto.
- Desativar (com confirmação: "sai do autocompletar das turmas; salvar uma turma com o nome dele o reativa") ou **Reativar**.

## 11.4 Integração com Turmas
- **Formulário de turma:** o campo Professor vira **autocompletar** (`<datalist>` com os professores ativos; busca no servidor ao digitar, para institutos com mais de 100). Abaixo do campo:
  - nome reconhecido (sem diferenciar acentos/maiúsculas) → "Preferências: …" com link para o professor;
  - nome novo → "Professor novo — será cadastrado ao salvar." (a API cria o cadastro).
- **Aba Turmas:** seletor **"Todos os professores"** filtra a lista e os contadores das abas (`?professor=<id>` na URL).

---

## Critérios de Aceitação
- [x] Menu "Professores" para `admin` e `user`; `admin` em somente leitura
- [x] Lista com busca, "Mostrar desativados" e pílulas de preferências
- [x] Formulário com quadros mínimos, andares preferidos e extremidade; em branco = sem preferência
- [x] Nome repetido (outra grafia) mostra erro no campo
- [x] Detalhe lista as turmas do professor em todos os semestres; desativar e reativar
- [x] Formulário de turma com autocompletar e aviso de professor novo / preferências do existente
- [x] Aba Turmas filtra por professor, com o filtro na URL
