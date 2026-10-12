<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'
import { isAxiosError } from 'axios'
import AppButton from '@/shared/components/AppButton.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import { readSpreadsheet, UnsupportedFileError, type Sheet } from '../import/spreadsheet'
import {
  IMPORT_FIELDS,
  guessMapping,
  detectHeaderRow,
  buildImportRows,
  columnLetter,
  type ColumnMapping,
  type ImportField,
} from '../import/mapping'
import {
  previewImport,
  applyImport,
  type ImportAction,
  type ImportIssue,
  type ImportResult,
} from '../services/turma.service'
import { downloadImportTemplate } from '../timetable.export'
import { DAY_OPTIONS } from '@/modules/allocation/helpers'
import { TURMA_CATEGORIES, categoryLabel } from '@/shared/constants/turmaCategories'
import { useUiStore } from '@/stores/ui'
import type { TurmaCategory, WeekDay } from '@/types'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const projectId = route.params.projectId as string
const listPath = `/projects/${projectId}/turmas`

// ---------------- 1) arquivo ----------------
const fileName = ref('')
const sheets = ref<Sheet[]>([])
const sheetIndex = ref(0)
const headerIndex = ref(0)
const mapping = ref<ColumnMapping | null>(null)
const defaultCategory = ref<TurmaCategory>('graduacao')
const reading = ref(false)
const readError = ref('')

const sheet = computed(() => sheets.value[sheetIndex.value] ?? null)
const headers = computed(() => sheet.value?.rows[headerIndex.value]?.cells ?? [])

function selectSheet(index: number) {
  sheetIndex.value = index
  const rows = sheets.value[index]?.rows ?? []
  headerIndex.value = detectHeaderRow(rows)
  mapping.value = guessMapping(rows[headerIndex.value]?.cells ?? [])
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  reading.value = true
  readError.value = ''
  result.value = null
  preview.value = null
  try {
    const read = await readSpreadsheet(file)
    if (!read.some((s) => s.rows.length > 1)) throw new Error('A planilha está vazia.')
    sheets.value = read
    fileName.value = file.name
    // primeira aba com conteúdo
    selectSheet(Math.max(0, read.findIndex((s) => s.rows.length > 1)))
  } catch (err) {
    sheets.value = []
    mapping.value = null
    readError.value =
      err instanceof UnsupportedFileError || (err instanceof Error && err.message === 'A planilha está vazia.')
        ? err.message
        : 'Não foi possível ler o arquivo. Confira se é um .xlsx ou .csv válido.'
  } finally {
    reading.value = false
  }
}

function onHeaderChange(index: number) {
  headerIndex.value = index
  mapping.value = guessMapping(sheet.value?.rows[index]?.cells ?? [])
}

function setColumn(field: ImportField, value: string) {
  if (!mapping.value) return
  mapping.value = { ...mapping.value, [field]: value === '' ? null : Number(value) }
}

// ---------------- 2) prévia ----------------
const missingRequired = computed(() =>
  mapping.value ? IMPORT_FIELDS.filter((f) => f.required && mapping.value![f.key] === null) : [],
)
const importRows = computed(() =>
  sheet.value && mapping.value ? buildImportRows(sheet.value.rows, headerIndex.value, mapping.value) : [],
)

const preview = ref<ImportResult | null>(null)
const previewing = ref(false)
const previewError = ref('')
let previewRequest = 0

async function runPreview() {
  const request = ++previewRequest
  if (!mapping.value || missingRequired.value.length || importRows.value.length === 0) {
    preview.value = null
    return
  }
  previewing.value = true
  previewError.value = ''
  try {
    const res = await previewImport({ projectId, defaultCategory: defaultCategory.value, rows: importRows.value })
    if (request === previewRequest) preview.value = res
  } catch (err) {
    if (request !== previewRequest) return
    preview.value = null
    previewError.value =
      isAxiosError(err) && err.response?.status === 422
        ? 'A planilha passa do limite (até 2000 turmas por importação) ou tem células longas demais.'
        : 'Não foi possível gerar a prévia.'
  } finally {
    if (request === previewRequest) previewing.value = false
  }
}

watchDebounced(
  () => JSON.stringify([fileName.value, sheetIndex.value, headerIndex.value, mapping.value, defaultCategory.value]),
  runPreview,
  { debounce: 300 },
)

const onlyProblems = ref(false)
const MAX_SHOWN = 500
const shownRows = computed(() => {
  const rows = preview.value?.rows ?? []
  const filtered = onlyProblems.value ? rows.filter((r) => r.issues.length) : rows
  return filtered.slice(0, MAX_SHOWN)
})
const toApply = computed(() => (preview.value ? preview.value.summary.create + preview.value.summary.update : 0))

// ---------------- 3) importação ----------------
const importing = ref(false)
const result = ref<ImportResult | null>(null)

async function runImport() {
  importing.value = true
  try {
    result.value = await applyImport({ projectId, defaultCategory: defaultCategory.value, rows: importRows.value })
    const s = result.value.summary
    ui.toast({ message: `Importação concluída: ${s.create} criada(s), ${s.update} atualizada(s)`, variant: 'success' })
  } catch {
    ui.toast({ message: 'Erro ao importar. Nenhuma alteração foi perdida; tente de novo.', variant: 'error' })
  } finally {
    importing.value = false
  }
}

function reset() {
  sheets.value = []
  mapping.value = null
  fileName.value = ''
  preview.value = null
  result.value = null
}

// ---------------- rótulos ----------------
const ACTION: Record<ImportAction, { label: string; variant: 'success' | 'info' | 'neutral' | 'danger' }> = {
  create: { label: 'Nova', variant: 'success' },
  update: { label: 'Atualizar', variant: 'info' },
  unchanged: { label: 'Sem mudanças', variant: 'neutral' },
  error: { label: 'Erro', variant: 'danger' },
}
const ISSUE_TEXT: Record<string, string> = {
  REQUIRED: 'campo obrigatório vazio',
  TOO_LONG: 'texto longo demais',
  INVALID_NUMBER: 'precisa ser um número inteiro',
  DUPLICATE_CODE: 'código repetido numa linha anterior do arquivo',
  SCHEDULE_UNRECOGNIZED: 'não entendi o dia e o horário (ex.: "SEG 08-10, QUA 08-10")',
  SCHEDULE_INVALID_TIME: 'horário inválido (o fim precisa ser depois do início)',
  SCHEDULE_SUNDAY: 'domingo não é dia letivo',
  SCHEDULE_EMPTY: 'sem dia e horário: a turma entra sem grade',
  CATEGORY_UNRECOGNIZED: 'categoria desconhecida: usada a categoria padrão',
  TURMA_INACTIVE: 'a turma está desativada e continua desativada',
}
const FIELD_LABEL: Record<string, string> = {
  name: 'Disciplina',
  code: 'Código',
  schedule: 'Dia e horário',
  sector: 'Setor',
  professor: 'Professor',
  notes: 'Anotações',
  studentCount: 'Nº de alunos',
  category: 'Categoria',
}
const dayShort = Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, d.label])) as Record<WeekDay, string>

function issueText(i: ImportIssue): string {
  return `${FIELD_LABEL[i.field] ?? i.field}: ${ISSUE_TEXT[i.code] ?? i.message}`
}
function headerOption(index: number): string {
  const cells = sheet.value?.rows[index]?.cells.filter(Boolean) ?? []
  return `Linha ${sheet.value?.rows[index]?.line}: ${cells.slice(0, 4).join(' · ') || '(vazia)'}`
}
function columnOption(index: number): string {
  return `${columnLetter(index)} · ${headers.value[index] || '(sem título)'}`
}

const selectClass =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
const cardClass = 'flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800'
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- resultado da importação -->
    <section v-if="result" :class="cardClass">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Importação concluída</h2>
      <p class="text-gray-700 dark:text-gray-200">
        <strong>{{ result.summary.create }}</strong> turma(s) criada(s),
        <strong>{{ result.summary.update }}</strong> atualizada(s) e {{ result.summary.unchanged }} sem mudanças.
        <span v-if="result.summary.error" class="text-amber-700 dark:text-amber-400">
          {{ result.summary.error }} linha(s) com erro ficaram de fora — corrija a planilha e importe de novo (nada é duplicado).
        </span>
      </p>
      <div class="flex gap-2">
        <AppButton @click="router.push(listPath)">Ver turmas</AppButton>
        <AppButton variant="secondary" @click="reset">Importar outro arquivo</AppButton>
      </div>
    </section>

    <template v-else>
      <!-- 1) arquivo -->
      <section :class="cardClass">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">1. Planilha de turmas</h2>
            <p class="mt-1 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
              A planilha que o gerente recebe: <strong>Nome da disciplina, Código da turma, Dia da semana e horário, Setor,
              Professor e Anotações</strong>. Nº de alunos e Categoria são opcionais. Turmas que já existem (mesmo código) são
              atualizadas; células vazias não apagam nada.
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Horários aceitos: "SEG 08-10, QUA 08-10" · "Seg/Qua 08:00-10:00" · "2ª 8h às 10h" · "Ter 14h30-16h30".
            </p>
          </div>
          <button
            type="button"
            class="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
            @click="downloadImportTemplate"
          >
            Baixar modelo (.xlsx)
          </button>
        </div>
        <label class="flex flex-wrap items-center gap-3">
          <span
            class="cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
            :class="reading ? 'opacity-60' : ''"
          >
            {{ reading ? 'Lendo…' : fileName ? 'Trocar arquivo' : 'Escolher arquivo' }}
          </span>
          <input type="file" accept=".xlsx,.csv" class="sr-only" :disabled="reading" @change="onFile" />
          <span class="text-sm text-gray-600 dark:text-gray-300">{{ fileName || 'XLSX ou CSV' }}</span>
        </label>
        <p v-if="readError" class="text-sm text-red-600 dark:text-red-400">{{ readError }}</p>
      </section>

      <!-- 2) colunas -->
      <section v-if="sheet && mapping" :class="cardClass">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">2. Colunas</h2>
        <div class="flex flex-wrap items-end gap-4">
          <label v-if="sheets.length > 1" class="flex flex-col gap-1 text-sm">
            <span class="font-medium text-gray-700 dark:text-gray-300">Aba</span>
            <select :value="sheetIndex" :class="selectClass" @change="selectSheet(Number(($event.target as HTMLSelectElement).value))">
              <option v-for="(s, i) in sheets" :key="s.name" :value="i">{{ s.name }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-medium text-gray-700 dark:text-gray-300">Linha de títulos</span>
            <select :value="headerIndex" :class="selectClass" @change="onHeaderChange(Number(($event.target as HTMLSelectElement).value))">
              <option v-for="i in Math.min(10, sheet.rows.length)" :key="i" :value="i - 1">{{ headerOption(i - 1) }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-medium text-gray-700 dark:text-gray-300">Categoria padrão</span>
            <select v-model="defaultCategory" :class="selectClass">
              <option v-for="c in TURMA_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </label>
        </div>
        <p class="-mt-1 text-xs text-gray-500 dark:text-gray-400">
          A categoria padrão vale para as linhas sem a coluna Categoria. Confira abaixo qual coluna da planilha é qual campo.
        </p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label v-for="f in IMPORT_FIELDS" :key="f.key" class="flex flex-col gap-1 text-sm">
            <span class="font-medium text-gray-700 dark:text-gray-300">
              {{ f.label }}<span v-if="f.required" class="ml-0.5 text-red-500">*</span>
            </span>
            <select
              :value="mapping[f.key] ?? ''"
              :class="[selectClass, f.required && mapping[f.key] === null ? 'border-red-400' : '']"
              :aria-label="`Coluna de ${f.label}`"
              @change="setColumn(f.key, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">— não usar —</option>
              <option v-for="(_, i) in headers" :key="i" :value="i">{{ columnOption(i) }}</option>
            </select>
          </label>
        </div>
        <p v-if="missingRequired.length" class="text-sm text-red-600 dark:text-red-400">
          Escolha a coluna de: {{ missingRequired.map((f) => f.label).join(', ') }}.
        </p>
      </section>

      <!-- 3) prévia -->
      <section v-if="sheet && mapping && !missingRequired.length" :class="cardClass">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            3. Prévia <span v-if="previewing" class="font-normal normal-case text-gray-400">· atualizando…</span>
          </h2>
          <label v-if="preview" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input v-model="onlyProblems" type="checkbox" class="h-4 w-4 accent-primary-600" />
            Só linhas com problema
          </label>
        </div>
        <p v-if="previewError" class="text-sm text-red-600 dark:text-red-400">{{ previewError }}</p>
        <p v-else-if="importRows.length === 0" class="text-sm text-gray-500 dark:text-gray-400">Nenhuma linha preenchida abaixo dos títulos.</p>

        <template v-if="preview">
          <div class="flex flex-wrap gap-2 text-sm" aria-label="Resumo da prévia">
            <span v-for="(meta, action) in ACTION" :key="action" class="flex items-center gap-1.5">
              <AppBadge :variant="meta.variant" :label="meta.label" />
              <strong class="text-gray-800 dark:text-gray-100">{{ preview.summary[action] }}</strong>
            </span>
          </div>

          <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead class="bg-gray-50 text-left text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
                <tr>
                  <th class="px-3 py-2 font-medium">Linha</th>
                  <th class="px-3 py-2 font-medium">Situação</th>
                  <th class="px-3 py-2 font-medium">Disciplina</th>
                  <th class="px-3 py-2 font-medium">Código</th>
                  <th class="px-3 py-2 font-medium">Horários</th>
                  <th class="px-3 py-2 font-medium">Professor</th>
                  <th class="px-3 py-2 font-medium">Categoria</th>
                  <th class="px-3 py-2 font-medium">Observações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 text-gray-700 dark:divide-gray-700 dark:text-gray-200">
                <tr v-for="r in shownRows" :key="r.line" :class="r.action === 'error' ? 'bg-red-50/60 dark:bg-red-950/20' : ''">
                  <td class="px-3 py-2 font-mono text-xs text-gray-500">{{ r.line }}</td>
                  <td class="whitespace-nowrap px-3 py-2"><AppBadge :variant="ACTION[r.action].variant" :label="ACTION[r.action].label" /></td>
                  <td class="px-3 py-2 font-medium">{{ r.name ?? '—' }}</td>
                  <td class="whitespace-nowrap px-3 py-2">{{ r.code ?? '—' }}</td>
                  <td class="whitespace-nowrap px-3 py-2 text-xs">
                    <span v-for="(s, i) in r.schedule ?? []" :key="i" class="block">{{ dayShort[s.day] }} {{ s.start }}–{{ s.end }}</span>
                    <span v-if="!r.schedule?.length" class="text-gray-400">—</span>
                  </td>
                  <td class="px-3 py-2">
                    {{ r.professor ?? '—' }}
                    <span
                      v-if="r.professorStatus === 'new' && r.action !== 'error'"
                      class="ml-1 whitespace-nowrap rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      title="Será cadastrado no cadastro de professores"
                    >novo</span>
                  </td>
                  <td class="px-3 py-2 text-xs">{{ r.category ? categoryLabel(r.category) : '—' }}</td>
                  <td class="px-3 py-2 text-xs">
                    <span v-if="r.changes.length" class="block text-primary-700 dark:text-primary-400">
                      muda: {{ r.changes.map((c) => FIELD_LABEL[c] ?? c).join(', ') }}
                    </span>
                    <span
                      v-for="(i, n) in r.issues"
                      :key="n"
                      class="block"
                      :class="i.severity === 'error' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'"
                    >
                      {{ i.severity === 'error' ? '✗' : '⚠' }} {{ issueText(i) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="(onlyProblems ? preview.rows.filter((r) => r.issues.length).length : preview.rows.length) > MAX_SHOWN" class="text-xs text-gray-500">
            Mostrando as primeiras {{ MAX_SHOWN }} linhas.
          </p>

          <div class="flex flex-wrap items-center justify-end gap-3">
            <span v-if="preview.summary.error" class="text-sm text-amber-700 dark:text-amber-400">
              {{ preview.summary.error }} linha(s) com erro ficarão de fora.
            </span>
            <AppButton variant="secondary" @click="router.push(listPath)">Cancelar</AppButton>
            <AppButton :disabled="toApply === 0 || previewing" :loading="importing" @click="runImport">
              {{ toApply === 0 ? 'Nada para importar' : `Importar ${toApply} turma(s)` }}
            </AppButton>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>
