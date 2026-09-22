<script setup lang="ts">
import { computed } from 'vue'
import type { ITurma, IRoom, IBuilding, IAllocation, WeekDay } from '@/types'

const props = defineProps<{
  rooms: IRoom[]
  buildings: IBuilding[]
  /** utilizações SEMANAIS já filtradas para o dia selecionado */
  weekly: IAllocation[]
  day: WeekDay
  turmaById: Map<string, ITurma>
  canManage: boolean
  groupByBuilding: boolean
}>()

const emit = defineEmits<{
  addAt: [{ roomId: string; start: string; end: string }]
  move: [IAllocation]
  remove: [IAllocation]
}>()

const pad = (n: number) => String(n).padStart(2, '0')
const hourOf = (t: string) => parseInt(t.slice(0, 2), 10)
const minuteOf = (t: string) => parseInt(t.slice(3, 5), 10)

// janela de horas: cobre os dados do dia, com um mínimo de 07h–19h
const window = computed(() => {
  let min = 7
  let max = 19
  for (const a of props.weekly) {
    min = Math.min(min, hourOf(a.timeSlot.start))
    const endCeil = hourOf(a.timeSlot.end) + (minuteOf(a.timeSlot.end) > 0 ? 1 : 0)
    max = Math.max(max, endCeil)
  }
  min = Math.max(6, min)
  max = Math.min(23, max)
  return { start: min, end: max }
})

const hours = computed(() => {
  const out: number[] = []
  for (let h = window.value.start; h < window.value.end; h++) out.push(h)
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
    | { kind: 'alloc'; alloc: IAllocation; col: number; span: number }
    | { kind: 'free'; col: number; hour: number }
  >
}
interface Group {
  key: string
  label: string | null
  rows: RoomRow[]
}

function buildRow(room: IRoom): RoomRow {
  const start = window.value.start
  const covered = new Array(nHours.value).fill(false)
  const cells: RoomRow['cells'] = []

  for (const a of props.weekly.filter((x) => x.roomId === room.id)) {
    const s = Math.max(0, hourOf(a.timeSlot.start) - start)
    const endCeil = hourOf(a.timeSlot.end) + (minuteOf(a.timeSlot.end) > 0 ? 1 : 0)
    const e = Math.min(nHours.value, endCeil - start)
    const span = Math.max(1, e - s)
    for (let i = s; i < s + span; i++) covered[i] = true
    cells.push({ kind: 'alloc', alloc: a, col: s + 1, span })
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
  // ordem: pela ordem dos prédios recebidos
  const order = props.buildings.map((b) => b.id).filter((id) => map.has(id))
  for (const id of map.keys()) if (!order.includes(id)) order.push(id)
  return order.map((id) => ({
    key: id,
    label: buildingById.value.get(id)?.name ?? '—',
    rows: (map.get(id) ?? []).map(buildRow),
  }))
})

function turmaLabel(id: string): string {
  return props.turmaById.get(id)?.name ?? '—'
}
function turmaProf(id: string): string {
  return props.turmaById.get(id)?.professor ?? ''
}
function onFree(roomId: string, hour: number) {
  if (!props.canManage) return
  const endHour = Math.min(hour + 2, window.value.end)
  const end = endHour > hour ? endHour : hour + 1
  emit('addAt', { roomId, start: `${pad(hour)}:00`, end: `${pad(end)}:00` })
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
    <div class="min-w-max">
      <!-- cabeçalho de horas -->
      <div class="flex border-b border-gray-100 dark:border-gray-700">
        <div class="w-40 shrink-0 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Sala</div>
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
          {{ g.label }}
        </div>

        <div
          v-for="row in g.rows"
          :key="row.room.id"
          class="flex min-h-[3.5rem] border-b border-gray-100 last:border-b-0 dark:border-gray-700"
        >
          <div class="flex w-40 shrink-0 flex-col justify-center px-3 py-2">
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
                :style="{ 'grid-column': `${cell.col} / span 1` }"
                :disabled="!canManage"
                :aria-label="`Alocar às ${pad(cell.hour)}h em ${row.room.name}`"
                @click="onFree(row.room.id, cell.hour)"
              >
                +
              </button>

              <!-- célula ocupada -->
              <div
                v-else
                class="group relative flex flex-col justify-center overflow-hidden border-l-4 border-primary-500 bg-primary-100/80 px-2 py-1 dark:bg-primary-900/40"
                :class="canManage ? 'cursor-pointer hover:bg-primary-200/80 dark:hover:bg-primary-900/60' : ''"
                :style="{ 'grid-column': `${cell.col} / span ${cell.span}` }"
                @click="canManage && emit('move', cell.alloc)"
              >
                <p class="truncate text-xs font-semibold text-primary-900 dark:text-primary-100">
                  {{ turmaLabel(cell.alloc.turmaId) }}
                </p>
                <p class="truncate text-[10px] text-primary-700/90 dark:text-primary-300/80">
                  {{ cell.alloc.timeSlot.start }}–{{ cell.alloc.timeSlot.end }}
                  <template v-if="turmaProf(cell.alloc.turmaId)"> · {{ turmaProf(cell.alloc.turmaId) }}</template>
                </p>
                <button
                  v-if="canManage"
                  type="button"
                  class="absolute right-0.5 top-0.5 hidden rounded bg-white/70 px-1 text-xs text-primary-500 hover:text-red-600 group-hover:block dark:bg-gray-900/70 dark:hover:text-red-400"
                  aria-label="Remover utilização"
                  @click.stop="emit('remove', cell.alloc)"
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
