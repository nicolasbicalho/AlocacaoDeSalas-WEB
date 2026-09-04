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
| 2 | Gerenciamento de Departamentos | [02-departments.md](./modules/02-departments.md) | `implemented` |
<!-- | 3 | Gerenciamento de Projetos | [03-projects.md](./modules/03-projects.md) | `draft` |
| 4 | Cadastro de Dados Base (Uploads) | [04-data-upload.md](./modules/04-data-upload.md) | `draft` |
| 5 | Alocação Automática | [05-auto-allocation.md](./modules/05-auto-allocation.md) | `draft` |
| 6 | Alocação Manual e Ajustes | [06-manual-allocation.md](./modules/06-manual-allocation.md) | `draft` |
| 7 | Relatórios e Exportação | [07-reports.md](./modules/07-reports.md) | `draft` | -->

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
01-auth → 02-departments → 03-projects → 04-data-upload → 05-auto-allocation → 06-manual-allocation → 07-reports
```

Cada módulo depende dos anteriores — não implementar fora de ordem.

## Relação com a API

Este projeto consome a **AlocacaoDeSalas-API**. As specs de módulo frontend estão alinhadas com os módulos da API correspondentes. Toda interação com dados segue os contratos definidos em [`AlocacaoDeSalas-API/specs/shared/api-conventions.md`](../../AlocacaoDeSalas-API/specs/shared/api-conventions.md).
