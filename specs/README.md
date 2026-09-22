# Especificações — AlocacaoDeSalas WEB

Este diretório contém todas as especificações do projeto frontend seguindo o modelo de **Spec Driven Development (SDD)**. Cada funcionalidade deve ter sua spec aprovada antes da implementação.

## Índice

### Produto
- [Visão Geral](./overview.md)

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
<!-- | 6 | Alocação Automática | [06-auto-allocation.md](./modules/06-auto-allocation.md) | `draft` |
| 7 | Alocação Manual e Ajustes | [07-manual-allocation.md](./modules/07-manual-allocation.md) | `draft` |
| 8 | Relatórios e Exportação | [08-reports.md](./modules/08-reports.md) | `draft` | -->

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
01-auth → 02-institutes → 03-projects → 04-physical-structure → 05-turmas → 06-auto-allocation → 07-manual-allocation → 08-reports
```

Cada módulo depende dos anteriores — não implementar fora de ordem.

## Relação com a API

Este projeto consome a **AlocacaoDeSalas-API**. As specs de módulo frontend estão alinhadas com os módulos da API correspondentes. Toda interação com dados segue os contratos definidos em [`AlocacaoDeSalas-API/specs/shared/api-conventions.md`](../../AlocacaoDeSalas-API/specs/shared/api-conventions.md).
