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
| `list` | `string` | — | id de um `<datalist>` (autocompletar; ex.: professor no `TurmaForm`) |

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

---

## AppBreadcrumb

Trilha de navegação. Todos os níveis são clicáveis, exceto o último (página atual, `aria-current="page"`). Separador `›`.

**Props:**
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `items` | `Crumb[]` | — | `{ label: string; to?: RouteLocationRaw }` — sem `to`, o item não é link |

Os tipos `Crumb` e `ContextTab` ficam em `src/shared/components/navigation.ts`. Nas páginas dentro de um shell (projeto/prédio) o breadcrumb é montado pelo próprio shell — as views não o declaram.

---

## AppContextHeader

Cabeçalho dos *shells* de contexto (`ProjectShell`, `BuildingShell`): breadcrumb, título, badge de status, metadado (ex.: período do semestre) e **abas** de seção.

**Props:**
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `title` | `string` | — | Nome da entidade |
| `crumbs` | `Crumb[]` | — | Repassado ao `AppBreadcrumb` |
| `tabs` | `ContextTab[]` | — | `{ label, to, active, count? }` — `count` mostra um contador ao lado do rótulo |

**Slots:** `badge` (ex.: `ProjectStatusBadge`), `meta` (texto secundário ao lado do título).

As abas são `RouterLink` com `aria-current="page"` na ativa; rolam horizontalmente em telas estreitas.

---

## FeatureCheckboxes

Grupo de checkboxes com as **características fixas de sala** (`ROOM_FEATURES`). Usado no `RoomForm` (características que a sala possui — `features`) e no `TurmaForm` (características exigidas — `requiredFeatures`). Substitui os antigos `RoomAttributesEditor` e `RequiredAttributesEditor`.

> Exceção ao prefixo `App`: conhece a lista fixa de características do domínio, mas continua **puro** (sem HTTP nem store).

**Opções (valor → rótulo):** `acessibilidade` Acessibilidade (PcD) · `camera` Câmera (transmissão) · `computadores` Computadores (lab. de informática) · `bancadas` Bancadas (lab. experimental) · `som` Sistema de som

**Props:**
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `modelValue` | `RoomFeature[]` | — | Características marcadas (v-model), sem repetição, na ordem do catálogo |
| `label` | `string` | — | Legenda do grupo (ex.: "Características", "Requisitos de sala") |
| `hint` | `string` | — | Texto de ajuda abaixo da legenda (opcional) |
| `readonly` | `boolean` | `false` | Somente leitura (ex.: `admin`) |

O catálogo com os rótulos fica em `src/shared/constants/roomFeatures.ts` (`ROOM_FEATURES`, `featureLabel()`), espelhando `ROOM_FEATURES` da API.

**Emits:** `update:modelValue`
