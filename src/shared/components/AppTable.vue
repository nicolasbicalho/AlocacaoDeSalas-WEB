<script setup lang="ts">
interface Column {
  key: string
  label: string
}

withDefaults(
  defineProps<{
    columns: Column[]
    rows: Array<Record<string, unknown>>
    loading?: boolean
    emptyMessage?: string
  }>(),
  { loading: false, emptyMessage: 'Nenhum registro encontrado' },
)
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-900/40">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        <template v-if="loading">
          <tr v-for="n in 5" :key="`skeleton-${n}`">
            <td v-for="col in columns" :key="col.key" class="px-4 py-3">
              <div class="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            </td>
          </tr>
        </template>
        <tr v-else-if="rows.length === 0">
          <td :colspan="columns.length" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            {{ emptyMessage }}
          </td>
        </tr>
        <template v-else>
          <tr v-for="(row, i) in rows" :key="i" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
            <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-gray-800 dark:text-gray-200">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
