<script setup lang="ts">
import { computed } from 'vue'
import { eventClasses } from '../helpers'
import type { ITurma, IRoom, IBuilding, IAllocation } from '@/types'

const props = defineProps<{
  rooms: IRoom[]
  buildings: IBuilding[]
  /** eventos da data selecionada (recorrentes do dia da semana + únicos da data) */
  events: IAllocation[]
  turmaById: Map<string, ITurma>
  canManage: boolean
  groupByBuilding: boolean
  /** id do evento a destacar (ex.: vindo do clique na lista de únicos) */
  highlightId?: string | null
}>()

const emit = defineEmits<{
  addAt: [{ roomId: string; start: string; end: string }]
  open: [IAllocation]
  remove: [IAllocation]
}>()

const pad = (n: number) => String(n).padStart(2, '0')
const hourOf = (t: string) => parseInt(t.slice(0, 2), 10)
const minuteOf = (t: string) => parseInt(t.slice(3, 5), 10)
const endHourCeil = (t: string) => hourOf(t) + (minuteOf(t) > 0 ? 1 : 0)

// janela de horas: cobre os eventos da data, com um mínimo de 07h–19h
const hourWindow = computed(() => {
  let min = 7
  let max = 19
  for (const a of props.events) {
    min = Math.min(min, hourOf(a.timeSlot.start))
    max = Math.max(max, endHourCeil(a.timeSlot.end))
  }
  return { start: Math.max(6, min), end: Math.min(23, max) }
})

const hours = computed(() => {
  const out: number[] = []
  for (let h = hourWindow.value.start; h < hourWindow.value.end; h++) out.push(h)
  return out
})

const nHours = computed(() => hours.value.length)
const gridStyle = computed(() => ({
  'grid-template-columns': `repeat(${nHours.value}, minmax(72px, 1fr))`,
  'min-width': `${nHours.value * 72}px`,
  'grid-auto-rows': '1fr',
}))

const buildingById = computed(() => new Map(props.buildings.map((b) => [b.id, b])))

interface RoomRow {
  room: IRoom
  cells: Array<
    | { kind: 'event'; event: IAllocation; col: number; span: number }
    | { kind: 'free'; col: number; hour: number }
  >
}
interface Group {
  key: string
  label: string | null
  rows: RoomRow[]
}

function buildRow(room: IRoom): RoomRow {
  const start = hourWindow.value.start
  const covered = new Array(nHours.value).fill(false)
  const cells: RoomRow['cells'] = []

  for (const a of props.events.filter((x) => x.roomId === room.id)) {
    const s = Math.max(0, hourOf(a.timeSlot.start) - start)
    const e = Math.min(nHours.value, endHourCeil(a.timeSlot.end) - start)
    const span = Math.max(1, e - s)
    for (let i = s; i < s + span; i++) covered[i] = true
    cells.push({ kind: 'event', event: a, col: s + 1, span })
  }
  for (let i = 0; i < nHours.value; i++) {
    if (!covered[i]) cells.push({ kind: 'free', col: i + 1, hour: hours.value[i] })
  }
  return { room, cells }
}

const groups = computed<Group[]>(() => {
  if (!props.groupByBuilding) {
    return [{ key: 'all', label: null, rows: props.rooms.map(buildRow) }]
  }
  const map = new Map<string, IRoom[]>()
  for (const r of props.rooms) {
    const list = map.get(r.buildingId) ?? []
    list.push(r)
    map.set(r.buildingId, list)
  }
  const order = props.buildings.map((b) => b.id).filter((id) => map.has(id))
  for (const id of map.keys()) if (!order.includes(id)) order.push(id)
  return order.map((id) => ({
    key: id,
    label: buildingById.value.get(id)?.name ?? '—',
    rows: (map.get(id) ?? []).map(buildRow),
  }))
})

// recorrente: tom da categoria da turma; único: cor escolhida
function classesOf(a: IAllocation) {
  return eventClasses(a, a.turmaId ? props.turmaById.get(a.turmaId)?.category : undefined)
}

function title(a: IAllocation): string {
  if (a.turmaId) return props.turmaById.get(a.turmaId)?.name ?? '—'
  return a.title ?? '—'
}
function subtitle(a: IAllocation): string {
  const parts = [`${a.timeSlot.start}–${a.timeSlot.end}`]
  if (a.type === 'single') parts.push('Único')
  const prof = a.turmaId ? props.turmaById.get(a.turmaId)?.professor : undefined
  if (prof) parts.push(prof)
  return parts.join(' · ')
}
function onFree(roomId: string, hour: number) {
  if (!props.canManage) return
  const endHour = Math.min(hour + 2, hourWindow.value.end)
  const end = endHour > hour ? endHour : hour + 1
  emit('addAt', { roomId, start: `${pad(hour)}:00`, end: `${pad(end)}:00` })
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
    <div class="min-w-max">
      <!-- cabeçalho de horas -->
      <div class="flex border-b border-gray-100 dark:border-gray-700">
        <div class="sticky left-0 z-20 w-40 shrink-0 border-r border-gray-100 bg-white px-3 py-2 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Sala</div>
        <div class="grid flex-1" :style="gridStyle">
          <div
            v-for="h in hours"
            :key="h"
            class="border-l border-gray-100 px-1 py-2 text-center text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            {{ pad(h) }}h
          </div>
        </div>
      </div>

      <template v-for="g in groups" :key="g.key">
        <div
          v-if="g.label"
          class="bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/40 dark:text-gray-400"
        >
          <span class="sticky left-3 inline-block">{{ g.label }}</span>
        </div>

        <div
          v-for="row in g.rows"
          :key="row.room.id"
          class="flex min-h-[3.5rem] border-b border-gray-100 last:border-b-0 dark:border-gray-700"
        >
          <div class="sticky left-0 z-20 flex w-40 shrink-0 flex-col justify-center border-r border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
            <span class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{{ row.room.name }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ row.room.code }} · cap. {{ row.room.capacity }}</span>
          </div>

          <div class="grid flex-1" :style="gridStyle">
            <template v-for="(cell, i) in row.cells" :key="i">
              <!-- célula livre -->
              <button
                v-if="cell.kind === 'free'"
                type="button"
                class="flex items-center justify-center border-l border-gray-100 text-lg leading-none text-gray-300 transition-colors dark:border-gray-700 dark:text-gray-600"
                :class="canManage ? 'cursor-pointer hover:bg-primary-50 hover:text-primary-500 dark:hover:bg-primary-950/40 dark:hover:text-primary-400' : 'cursor-default'"
                :style="{ 'grid-column': `${cell.col} / span 1`, 'grid-row': '1' }"
                :disabled="!canManage"
                :aria-label="`Adicionar evento às ${pad(cell.hour)}h em ${row.room.name}`"
                @click="onFree(row.room.id, cell.hour)"
              >
                +
              </button>

              <!-- evento -->
              <div
                v-else
                :id="`event-${cell.event.id}`"
                class="group relative flex flex-col justify-center overflow-hidden border-l-4 px-2 py-1 transition-shadow"
                :class="[
                  classesOf(cell.event).block,
                  canManage ? 'cursor-pointer' : '',
                  highlightId === cell.event.id ? 'z-10 shadow-lg ring-2 ring-inset ring-gray-900 dark:ring-white' : '',
                ]"
                :style="{ 'grid-column': `${cell.col} / span ${cell.span}`, 'grid-row': '1' }"
                :title="`${title(cell.event)} — ${subtitle(cell.event)}`"
                @click="canManage && emit('open', cell.event)"
              >
                <p class="truncate text-xs font-semibold">{{ title(cell.event) }}</p>
                <p class="truncate text-[10px]" :class="classesOf(cell.event).sub">{{ subtitle(cell.event) }}</p>
                <button
                  v-if="canManage"
                  type="button"
                  class="absolute right-0.5 top-0.5 hidden rounded bg-white/70 px-1 text-xs text-gray-600 hover:text-red-600 group-hover:block dark:bg-gray-900/70 dark:text-gray-300 dark:hover:text-red-400"
                  aria-label="Remover evento"
                  @click.stop="emit('remove', cell.event)"
                >
                  ✕
                </button>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
