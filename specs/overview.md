# Visão Geral do Produto — Frontend

> Este documento é o espelho da visão de produto da API. O frontend implementa a interface gráfica para os mesmos fluxos descritos em [`AlocacaoDeSalas-API/specs/overview.md`](../../AlocacaoDeSalas-API/specs/overview.md).

## O que é

AlocacaoDeSalas é um sistema web para gerenciamento de alocação de salas em instituições de ensino. O frontend oferece a interface gráfica completa para que administradores e gerentes de instituto possam operar o sistema: autenticar, gerenciar dados, executar alocações e consultar relatórios.

## Problema que Resolve

O processo manual de alocação de salas é propenso a conflitos, subutilização de espaços e retrabalho a cada semestre. O frontend centraliza esse processo em uma interface intuitiva, com feedback visual em tempo real sobre conflitos, ocupação e resultados da alocação automática.

## Usuários e Permissões de Tela

| Role | Acesso |
|------|--------|
| `admin` | Gerenciamento de usuários, institutos e toda a plataforma |
| `user` | Gerente de instituto — criação de projetos, importação de dados, execução e ajuste de alocações, relatórios |

Cada rota do frontend verifica o role do usuário autenticado. Tentativa de acesso a rota não permitida redireciona para a tela de início correspondente ao role.

## Glossário

| Termo | Definição |
|-------|-----------|
| **Instituto** | Unidade organizacional gestora; dono dos prédios e agrupa os usuários (gerentes) |
| **Projeto** | Ciclo de alocação de um semestre/período letivo, com data de início e de término |
| **Prédio** | Estrutura física pertencente a um instituto |
| **Sala** | Espaço físico dentro de um prédio (capacidade e características) |
| **Características** | Lista fixa marcada por checkboxes: Projetor, Ar-condicionado, Acessibilidade (PcD), Computadores, Sistema de som, Bancadas. A sala marca as que tem; a turma, as que exige |
| **Turma** | Grupo de alunos em uma disciplina com professor, requisitos de sala e grade de horários |
| **Alocação** | Ato de atribuir uma turma a uma sala em um horário (manual ou automática) |
| **Evento** | Unidade do cronograma (antes "utilização"): uma sala ocupada em um horário — recorrente ou único |
| **Evento recorrente** | Evento de uma turma que se repete toda semana no mesmo dia/horário, durante o período do projeto |
| **Evento único** | Evento em uma data do semestre: de uma turma (ex.: reposição) ou de texto livre (ex.: palestra), com cor escolhida |
| **Cronograma** | Calendário completo dos eventos de salas de um projeto ao longo do semestre |
| **Conflito** | Dois eventos na mesma sala no mesmo horário, ou uma turma em dois lugares ao mesmo tempo |
| **Restrição** | Regra que condiciona uma alocação |
| **Auditoria** | Registro de quem fez o quê e quando (alterações e logins), consultado pelo `admin` em `/audit` |

## Cronograma / Calendário de Eventos

A alocação monta um **calendário de eventos** de salas ao longo de todo o semestre de um projeto, entre as **datas reais** de início e término. Um *evento* é **recorrente** (turma, toda semana) ou **único** (uma data; turma ou texto livre).

- O **processamento automático** gera os eventos recorrentes das turmas para o semestre inteiro, respeitando os eventos manuais.
- O usuário navega pelo cronograma **por data** (semana a semana, dentro do semestre) e vê a grade sala × hora do dia (ocupado × livre).
- O usuário pode **escolher um horário disponível** em qualquer sala e **adicionar um evento manualmente** — recorrente ou único.

A alocação **manual** (telas base do cronograma) é entregue antes da **automática**.

## Fluxo Principal (perspectiva de telas)

```
1. Usuário acessa /login → autentica com e-mail e senha
2. Admin cria institutos em /institutes
3. Admin cria usuários em /users
4. Usuário acessa /projects → cria um projeto (ex: "2025/2") com data de início e de término
5. Usuário cadastra prédios, salas (com características) e turmas (com requisitos) do projeto
6. Usuário acessa /projects/:id/allocation → monta o cronograma manualmente
   (navega pelas datas e adiciona eventos recorrentes ou únicos em horários disponíveis)
7. Usuário executa a alocação automática na mesma tela → cronograma completo do semestre
8. Usuário consulta /projects/:id/reports
9. Admin consulta /audit → quem alterou o quê e quando
```

## Escopo do MVP

### Incluído
- Tela de login, logout e recuperação de senha
- Gerenciamento de institutos (admin)
- Gerenciamento de usuários (admin)
- Criação e listagem de projetos, com datas do semestre (user)
- Cadastro de prédios, salas e turmas, com características fixas por checkboxes (user)
- Cronograma por data e adição manual de eventos — recorrentes ou únicos, com cor nos únicos (user)
- Visualização e execução de alocação automática (user)
- Relatórios de ocupação e exportação (user)
- Auditoria das alterações e logins (admin)
- Tema claro/escuro (dark mode) com preferência salva

### Fora do escopo (versão atual)
- Notificações em tempo real (WebSocket)
- Aplicativo mobile / PWA
