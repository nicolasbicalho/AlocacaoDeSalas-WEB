<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import ProjectStatusBadge from '@/modules/project/components/ProjectStatusBadge.vue'
import StatCard from './StatCard.vue'
import { loadUserDashboard, type UserDashboardData } from '../services/dashboard.service'
import {
  coverage,
  idleRooms,
  nextDateForWeekday,
  referenceDate,
  semesterProgress,
  upcomingSingles,
} from '../helpers'
import { dayLabel, eventClasses, formatDateBR, todayISO } from '@/modules/allocation/helpers'
import { useUiStore } from '@/stores/ui'
import type { IAllocation } from '@/types'

const ui = useUiStore()
const router = useRouter()

const data = ref<UserDashboardData | null>(null)
const loading = ref(true)
const today = todayISO()
const PENDING_SHOWN = 6

onMounted(async () => {
  try {
    data.value = await loadUserDashboard()
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar a página inicial.', variant: 'error' })
  } finally {
    loading.value = false
  }
})

const project = computed(() => data.value?.active ?? null)
const hasDates = computed(() => !!project.value?.startDate && !!project.value?.endDate)

const progress = computed(() =>
  project.value && hasDates.value ? semesterProgress(project.value.startDate, project.value.endDate, today) : null,
)
const refDate = computed(() =>
  project.value && hasDates.value ? referenceDate(project.value.startDate, project.value.endDate, today) : today,
)

const cov = computed(() => coverage(data.value?.turmas ?? [], data.value?.allocations ?? []))
const coveragePercent = computed(() =>
  cov.value.total ? Math.round((cov.value.covered / cov.value.total) * 100) : 0,
)
const idle = computed(() => idleRooms(data.value?.rooms ?? [], data.value?.allocations ?? []))
const activeTurmas = computed(() => (data.value?.turmas ?? []).filter((t) => t.active))
const activeRooms = computed(() => (data.value?.rooms ?? []).filter((r) => r.active))

const upcoming = computed(() =>
  progress.value?.phase === 'after' ? [] : upcomingSingles(data.value?.allocations ?? [], refDate.value, 5),
)

const turmaById = computed(() => new Map((data.value?.turmas ?? []).map((t) => [t.id, t])))
const roomById = computed(() => new Map((data.value?.rooms ?? []).map((r) => [r.id, r])))

const allocationPath = computed(() => (project.value ? `/projects/${project.value.id}/allocation` : '/projects'))

function pendingLink(p: (typeof cov.value.pending)[number]): RouteLocationRaw {
  const date = project.value ? nextDateForWeekday(refDate.value, p.slot.day, project.value.endDate) : null
  return {
    path: allocationPath.value,
    query: { ...(date ? { date } : {}), turma: p.turma.id, start: p.slot.start, end: p.slot.end },
  }
}
function eventLink(a: IAllocation): RouteLocationRaw {
  return { path: allocationPath.value, query: { event: a.id } }
}
function eventTitle(a: IAllocation): string {
  if (a.turmaId) return turmaById.value.get(a.turmaId)?.name ?? '—'
  return a.title ?? '—'
}
function roomLabel(id: string): string {
  const r = roomById.value.get(id)
  return r ? `${r.name} (${r.code})` : '—'
}
const shortDay = (d: Parameters<typeof dayLabel>[0]) => dayLabel(d).slice(0, 3)
</script>

<template>
  <div v-if="loading" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
    <AppSpinner size="lg" />
  </div>

  <!-- sem projeto ativo: orienta o próximo passo -->
  <div
    v-else-if="data && !project"
    class="flex flex-col items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-800"
  >
    <template v-if="data.drafts.length">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Nenhum projeto ativo</h2>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        O projeto <strong>{{ data.drafts[0].name }}</strong> está em rascunho. Ative-o para começar a montar o cronograma do semestre.
      </p>
      <AppButton @click="router.push(`/projects/${data.drafts[0].id}`)">Abrir projeto</AppButton>
    </template>
    <template v-else>
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Comece pelo projeto do semestre</h2>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Um projeto reúne as turmas e o cronograma de um semestre. Crie o primeiro para começar.
      </p>
      <AppButton @click="router.push('/projects/new')">Criar projeto</AppButton>
    </template>
  </div>

  <div v-else-if="data && project" class="flex flex-col gap-4">
    <!-- projeto ativo -->
    <section class="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">{{ project.name }}</h2>
            <ProjectStatusBadge :status="project.status" />
          </div>
          <p v-if="hasDates" class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDateBR(project.startDate) }} – {{ formatDateBR(project.endDate) }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppButton size="sm" @click="router.push(allocationPath)">Abrir cronograma</AppButton>
          <AppButton size="sm" variant="secondary" @click="router.push(`/projects/${project.id}/turmas`)">Ver turmas</AppButton>
          <AppButton size="sm" variant="secondary" @click="router.push(`/projects/${project.id}/turmas/new`)">Nova turma</AppButton>
        </div>
      </div>

      <div v-if="progress" class="mt-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          <template v-if="progress.phase === 'before'">
            O semestre começa em <strong>{{ progress.daysToStart }} dia(s)</strong>.
          </template>
          <template v-else-if="progress.phase === 'running'">
            Semana <strong>{{ progress.week }}</strong> de {{ progress.totalWeeks }}
          </template>
          <template v-else>
            O semestre terminou há {{ progress.daysSinceEnd }} dia(s). Encerre o projeto para liberar o próximo.
          </template>
        </p>
        <div v-if="progress.phase === 'running'" class="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div class="h-full rounded-full bg-primary-500" :style="{ width: `${progress.percent}%` }" />
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- progresso da alocação -->
      <section class="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Progresso da alocação</h3>
        <template v-if="cov.total > 0">
          <p class="text-gray-700 dark:text-gray-200">
            <span class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ cov.covered }}</span>
            de {{ cov.total }} horários de turma já têm sala
          </p>
          <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              class="h-full rounded-full transition-all"
              :class="coveragePercent === 100 ? 'bg-green-500' : 'bg-primary-500'"
              :style="{ width: `${coveragePercent}%` }"
            />
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ coveragePercent }}% da grade semanal das turmas alocada</p>
        </template>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          As turmas ainda não têm horários na grade — o progresso aparece assim que houver horários cadastrados.
        </p>
        <div class="mt-auto grid grid-cols-3 gap-2">
          <StatCard :value="activeTurmas.length" label="Turmas" :to="`/projects/${project.id}/turmas`" />
          <StatCard :value="activeRooms.length" label="Salas" to="/buildings" />
          <StatCard :value="idle.length" label="Salas sem aula fixa" />
        </div>
      </section>

      <!-- pendências -->
      <section class="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pendências</h3>

        <p
          v-if="activeTurmas.length === 0"
          class="text-sm text-gray-600 dark:text-gray-300"
        >
          Nenhuma turma cadastrada.
          <RouterLink :to="`/projects/${project.id}/turmas/new`" class="font-medium text-primary-700 hover:underline dark:text-primary-400">Cadastrar turma</RouterLink>
        </p>

        <p
          v-else-if="cov.pending.length === 0 && cov.withoutSchedule.length === 0"
          class="flex items-center gap-2 text-sm text-green-700 dark:text-green-400"
        >
          ✓ Todos os horários das turmas já têm sala.
        </p>

        <ul v-else class="flex flex-col gap-1">
          <li v-for="p in cov.pending.slice(0, PENDING_SHOWN)" :key="`${p.turma.id}-${p.slot.day}-${p.slot.start}`">
            <RouterLink
              :to="pendingLink(p)"
              class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-amber-50 dark:text-gray-200 dark:hover:bg-amber-950/30"
              title="Alocar este horário"
            >
              <span class="text-amber-500" aria-hidden="true">⚠</span>
              <span class="font-medium">{{ p.turma.name }}</span>
              <span class="text-gray-500 dark:text-gray-400">{{ shortDay(p.slot.day) }} {{ p.slot.start }}–{{ p.slot.end }} sem sala</span>
              <span class="ml-auto text-xs text-primary-700 dark:text-primary-400">Alocar →</span>
            </RouterLink>
          </li>
          <li v-if="cov.pending.length > PENDING_SHOWN" class="px-2 text-xs text-gray-500 dark:text-gray-400">
            + {{ cov.pending.length - PENDING_SHOWN }} horário(s) —
            <RouterLink :to="allocationPath" class="text-primary-700 hover:underline dark:text-primary-400">ver no cronograma</RouterLink>
          </li>
          <li v-for="t in cov.withoutSchedule" :key="t.id">
            <RouterLink
              :to="`/turmas/${t.id}`"
              class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
            >
              <span class="text-gray-400" aria-hidden="true">•</span>
              <span class="font-medium">{{ t.name }}</span>
              <span class="text-gray-500 dark:text-gray-400">sem horários na grade</span>
              <span class="ml-auto text-xs text-primary-700 dark:text-primary-400">Editar →</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>

    <!-- próximos eventos únicos -->
    <section class="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Próximos eventos únicos</h3>
      <p v-if="upcoming.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
        Nenhum evento único programado.
        <RouterLink :to="allocationPath" class="font-medium text-primary-700 hover:underline dark:text-primary-400">Adicionar no cronograma</RouterLink>
      </p>
      <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
        <li v-for="a in upcoming" :key="a.id">
          <RouterLink
            :to="eventLink(a)"
            class="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm transition-colors hover:text-primary-700 dark:hover:text-primary-400"
            title="Ver na grade"
          >
            <span class="h-3 w-3 shrink-0 rounded-full" :class="eventClasses(a).swatch" />
            <span class="w-28 text-gray-700 dark:text-gray-200">
              {{ formatDateBR(a.date!) }} <span class="text-gray-400 dark:text-gray-500">{{ shortDay(a.timeSlot.day) }}</span>
            </span>
            <span class="w-24 font-mono text-gray-600 dark:text-gray-300">{{ a.timeSlot.start }}–{{ a.timeSlot.end }}</span>
            <span class="font-medium text-gray-800 dark:text-gray-100">{{ eventTitle(a) }}</span>
            <span class="text-gray-500 dark:text-gray-400">{{ roomLabel(a.roomId) }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>
