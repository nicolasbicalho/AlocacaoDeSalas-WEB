# Componentes de UI Compartilhados

Todos os componentes reutilizáveis ficam em `src/shared/components/`. São componentes sem dependência de domínio — recebem dados via props e comunicam eventos para o pai.

---

## Princípios

- Componentes compartilhados são **puros**: sem chamadas HTTP, sem acesso a stores
- Nomes com prefixo `App` para distinguir de componentes de módulo (ex: `AppButton`, `AppModal`)
- Toda prop é tipada com TypeScript; toda emissão é declarada com `defineEmits`
- Acessibilidade básica: `aria-label`, `role`, foco por teclado onde aplicável

---

## AppButton

Botão padrão da aplicação.

**Props:**
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Estilo visual |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho |
| `loading` | `boolean` | `false` | Exibe spinner e desabilita |
| `disabled` | `boolean` | `false` | Desabilita o botão |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Tipo HTML |

**Slots:** `default` (conteúdo/label)

---

## AppInput

Campo de texto com suporte a label, erro e ícone.

**Props:**
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `modelValue` | `string` | — | Valor (v-model) |
| `label` | `string` | — | Label acima do input |
| `placeholder` | `string` | — | Placeholder |
| `error` | `string` | — | Mensagem de erro (exibida abaixo) |
| `type` | `string` | `'text'` | Tipo HTML do input |
| `disabled` | `boolean` | `false` | Desabilita o campo |
| `required` | `boolean` | `false` | Marca como obrigatório |

**Emits:** `update:modelValue`

---

## AppSelect

Select com label e erro.

**Props:**
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `modelValue` | `string \| number` | — | Valor selecionado (v-model) |
| `options` | `Array<{ value: string \| number; label: string }>` | — | Opções |
| `label` | `string` | — | Label |
| `error` | `string` | — | Mensagem de erro |
| `placeholder` | `string` | `'Selecione...'` | Opção vazia |
| `disabled` | `boolean` | `false` | Desabilita |

**Emits:** `update:modelValue`

---

## AppModal

Modal com overlay e slot de conteúdo.

**Props:**
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `open` | `boolean` | — | Controla visibilidade |
| `title` | `string` | — | Título do modal |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Largura do modal |

**Emits:** `close`

**Slots:** `default` (corpo), `footer` (ações)

---

## AppTable

Tabela responsiva com suporte a loading e estado vazio.

**Props:**
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `columns` | `Array<{ key: string; label: string; sortable?: boolean }>` | — | Definição de colunas |
| `rows` | `Array<Record<string, unknown>>` | — | Dados |
| `loading` | `boolean` | `false` | Exibe skeleton loader |
| `emptyMessage` | `string` | `'Nenhum registro encontrado'` | Mensagem de lista vazia |

**Slots:** `cell-{key}` para customizar renderização de cada coluna

---

## AppPagination

Controle de paginação.

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `page` | `number` | Página atual |
| `totalPages` | `number` | Total de páginas |
| `total` | `number` | Total de registros |

**Emits:** `update:page`

---

## AppBadge

Badge de status.

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `variant` | `'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` | Cor |
| `label` | `string` | Texto |

---

## AppToast

Notificações temporárias (toasts). Gerenciado globalmente via `useUiStore`.

**Variantes:** `success`, `error`, `warning`, `info`

Uso:
```typescript
const ui = useUiStore()
ui.toast({ message: 'Instituto criado com sucesso', variant: 'success' })
ui.toast({ message: 'Erro ao salvar', variant: 'error' })
```

---

## AppSpinner

Indicador de carregamento circular.

**Props:**
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho |

---

## AppEmptyState

Estado vazio para listas e páginas sem dados.

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `title` | `string` | Título |
| `description` | `string` | Descrição opcional |

**Slots:** `action` (botão ou link de ação)

---

## AppConfirmDialog

Diálogo de confirmação para ações destrutivas.

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Visibilidade |
| `title` | `string` | Título da confirmação |
| `message` | `string` | Corpo da mensagem |
| `confirmLabel` | `string` | Label do botão confirmar (default: `'Confirmar'`) |
| `variant` | `'danger' \| 'warning'` | Estilo do botão de confirmação |

**Emits:** `confirm`, `cancel`
