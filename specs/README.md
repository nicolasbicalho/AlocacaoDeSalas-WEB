# Especificações — AlocacaoDeSalas WEB

Este diretório contém todas as especificações do projeto frontend seguindo o modelo de **Spec Driven Development (SDD)**. Cada funcionalidade deve ter sua spec aprovada antes da implementação.

## Índice

### Produto
- [Visão Geral](./overview.md)

### Levantamentos e Planos
Ficam no repositório da API (valem para os dois projetos):
- [Levantamento — conversa com o gerente que aloca as salas (2026-10-12)](../../AlocacaoDeSalas-API/specs/research/2026-10-12-entrevista-gerente.md)
- [Plano — mudanças a partir do feedback do gerente](../../AlocacaoDeSalas-API/specs/plans/2026-10-plano-feedback-gerente.md) `draft`

### Arquitetura e Convenções
- [Arquitetura Geral](./architecture.md)
- [Componentes de UI Compartilhados](./shared/ui-components.md)
- [Gerenciamento de Estado](./shared/state-management.md)
- [Cliente HTTP / Integração com API](./shared/api-client.md)
- [Roteamento](./shared/routing.md)
- [Estratégia de Testes](./shared/testing.md)

### Módulos
| # | Módulo | Arquivo | Status |
|---|--------|---------|--------|
| 1 | Autenticação e Autorização | [01-auth.md](./modules/01-auth.md) | `implemented` |
| 2 | Gerenciamento de Institutos | [02-institutes.md](./modules/02-institutes.md) | `implemented` |
| 3 | Gerenciamento de Projetos | [03-projects.md](./modules/03-projects.md) | `implemented` |
| 4 | Estrutura Física (Prédios e Salas) | [04-physical-structure.md](./modules/04-physical-structure.md) | `implemented` |
| 5 | Gerenciamento de Turmas | [05-turmas.md](./modules/05-turmas.md) | `implemented` |
| 6 | Alocação Manual e Cronograma | [06-manual-allocation.md](./modules/06-manual-allocation.md) | `implemented` |
| 7 | Alocação Automática | [07-auto-allocation.md](./modules/07-auto-allocation.md) | `draft` |
| 9 | Auditoria (transversal) | [09-audit.md](./modules/09-audit.md) | `implemented` |
| 10 | Página Inicial (Dashboard) | [10-dashboard.md](./modules/10-dashboard.md) | `implemented` |
<!-- | 8 | Relatórios e Exportação | [08-reports.md](./modules/08-reports.md) | `draft` | -->

## Status Possíveis
- `draft` — em elaboração, não pronto para implementação
- `review` — aguardando revisão/aprovação
- `approved` — aprovado, pode ser implementado
- `implemented` — implementado e testado

## Fluxo de Trabalho SDD

```
1. Escrever/atualizar spec (.md)
2. Revisar e aprovar a spec
3. Implementar baseado na spec
4. Validar implementação contra a spec
5. Marcar como `implemented`
```

## Ordem de Implementação Recomendada

```
01-auth → 02-institutes → 03-projects → 04-physical-structure → 05-turmas → 06-manual-allocation → 09-audit → 07-auto-allocation → 08-reports
```

Cada módulo depende dos anteriores — não implementar fora de ordem.

> **Exceção — 09-audit:** módulo **transversal** (consulta, pelo `admin`, os registros de todos os módulos; depende apenas de 01-auth). Por isso foi implementado **antes** de 07-auto-allocation e 08-reports.
>
> **10-dashboard:** página inicial que só compõe dados de 03, 05, 06 e 09 (sem API própria); implementada logo após eles e evolui junto com 07/08.

## Relação com a API

Este projeto consome a **AlocacaoDeSalas-API**. As specs de módulo frontend estão alinhadas com os módulos da API correspondentes. Toda interação com dados segue os contratos definidos em [`AlocacaoDeSalas-API/specs/shared/api-conventions.md`](../../AlocacaoDeSalas-API/specs/shared/api-conventions.md).
