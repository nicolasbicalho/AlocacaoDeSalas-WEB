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
| **Instituto** | Unidade organizacional gestora; dono dos prédios e agrupa coordenadores |
| **Projeto** | Ciclo de alocação de um semestre/período letivo |
| **Prédio** | Estrutura física pertencente a um instituto |
| **Sala** | Espaço físico dentro de um prédio (tipo, capacidade, recursos) |
| **Turma** | Grupo de alunos em uma disciplina com professor e grade de horários |
| **Alocação** | Atribuição de turma a sala em horário específico dentro de um projeto |
| **Conflito** | Duas turmas na mesma sala no mesmo horário |
| **Restrição** | Regra que condiciona uma alocação |

## Fluxo Principal (perspectiva de telas)

```
1. Usuário acessa /login → autentica com e-mail e senha
2. Admin cria institutos em /institutes
3. Admin cria usuários em /users
4. Usuário acessa /projects → cria um projeto (ex: "2025/2")
5. Usuário acessa /projects/:id/upload → importa prédios, salas e turmas
6. Usuário acessa /projects/:id/allocation → executa alocação automática
7. Usuário revisa em /projects/:id/allocation → aplica ajustes manuais
8. Usuário consulta /projects/:id/reports
```

## Escopo do MVP

### Incluído
- Tela de login, logout e recuperação de senha
- Gerenciamento de institutos (admin)
- Gerenciamento de usuários (admin)
- Criação e listagem de projetos (user)
- Upload de dados base via arquivo (user)
- Visualização e execução de alocação automática (user)
- Ajustes manuais pós-alocação (user)
- Relatórios de ocupação e exportação (user)
- Tema claro/escuro (dark mode) com preferência salva

### Fora do escopo (versão atual)
- Notificações em tempo real (WebSocket)
- Aplicativo mobile / PWA
