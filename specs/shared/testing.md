# Estratégia de Testes

## Ferramentas

| Ferramenta | Uso |
|-----------|-----|
| Vitest | Runner e assertions |
| Vue Test Utils | Montagem e interação com componentes Vue |
| @testing-library/vue | Queries semânticas (alternativa ao VTU direto) |
| MSW (Mock Service Worker) | Mock de requisições HTTP nos testes de componente |

---

## Tipos de Teste

### Testes Unitários — Composables e Serviços

Testam funções puras: composables (`use*`), funções utilitárias e serviços HTTP com chamadas mockadas.

- **Localização:** ao lado do arquivo testado (`institute.service.test.ts`)
- **HTTP:** mockado via `vi.mock` ou MSW
- **Sem Vue:** sem montar componentes — testa lógica pura

```typescript
// institute.service.test.ts
import { vi, describe, it, expect } from 'vitest'
import { listInstitutes } from './institute.service'
import api from '@/services/api'

vi.mock('@/services/api')

describe('listInstitutes', () => {
  it('should return paginated institutes', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    })
    const result = await listInstitutes()
    expect(result.data).toEqual([])
  })
})
```

### Testes de Componente

Testam componentes Vue de forma isolada — renderização, interações, emissões.

- **Localização:** ao lado do componente (`InstituteStatusBadge.test.ts`)
- **Ferramentas:** Vue Test Utils + @testing-library/vue
- **Mocks:** props injetadas diretamente; stores mockadas com `createTestingPinia`

```typescript
// InstituteStatusBadge.test.ts
import { render, screen } from '@testing-library/vue'
import InstituteStatusBadge from './InstituteStatusBadge.vue'

describe('InstituteStatusBadge', () => {
  it('should display "Ativo" when active is true', () => {
    render(InstituteStatusBadge, {
      props: { active: true },
    })
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })
})
```

### Testes de Integração — Views

Testam uma view completa com store e roteamento reais (ou levemente mockados), cobrindo o fluxo do usuário.

- **Localização:** `src/modules/<nome>/views/__tests__/<NomeView>.test.ts`
- **HTTP:** mockado via MSW
- **Store:** instância real do Pinia com estado inicial controlado
- **Router:** instância de router de teste com rotas do módulo

---

## Cobertura Esperada

| Camada | Meta |
|--------|------|
| Composables e serviços HTTP | ≥ 80% de linhas |
| Componentes compartilhados | 100% do happy path + variantes visuais principais |
| Views (integração) | 100% dos fluxos principais (happy path + erros de formulário) |

---

## O que NÃO testar

- Comportamento interno do Vue Router, Pinia ou Axios
- Estilos CSS e classes Tailwind
- Componentes de terceiros (ex: biblioteca de ícones)
- Snapshots automáticos de HTML completo

---

## Convenções

- Nomes de arquivo: `<nome-do-arquivo-testado>.test.ts`
- Estrutura: `describe('<NomeComponente ou função>')` > `it('should <comportamento>')`
- Cada `it` testa exatamente um comportamento
- Nenhum teste depende da ordem ou estado de outro teste
- Usar `screen.getByRole`, `screen.getByText` ao invés de `wrapper.find('.class')`

---

## Configuração (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

---

## Variáveis de Ambiente para Testes

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

O MSW intercepta as chamadas em runtime de teste — não é necessário um servidor real rodando.

---

## Status por Módulo

| Módulo | Unitário | Componente | Integração |
|--------|----------|------------|------------|
| Auth | `pending` | `pending` | `pending` |
| Institutes | `pending` | `pending` | `pending` |
| Projects | `pending` | `pending` | `pending` |
| Data Upload | `pending` | `pending` | `pending` |
| Allocation | `pending` | `pending` | `pending` |
| Reports | `pending` | `pending` | `pending` |

> Atualizar esta tabela conforme os testes forem implementados.
