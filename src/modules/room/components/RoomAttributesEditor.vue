<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RoomAttribute, RoomAttributeValue } from '@/types'

type AttrType = 'text' | 'number' | 'boolean'
interface Row {
  key: string
  type: AttrType
  value: RoomAttributeValue
}

const props = withDefaults(
  defineProps<{ modelValue: RoomAttribute[]; readonly?: boolean }>(),
  { readonly: false },
)
const emit = defineEmits<{ 'update:modelValue': [value: RoomAttribute[]] }>()

function fromModel(attrs: RoomAttribute[]): Row[] {
  return attrs.map((a) => ({
    key: a.key,
    type: typeof a.value === 'number' ? 'number' : typeof a.value === 'boolean' ? 'boolean' : 'text',
    value: a.value,
  }))
}

function toModel(rows: Row[]): RoomAttribute[] {
  return rows
    .filter((r) => r.key.trim() !== '')
    .map((r) => {
      let value: RoomAttributeValue
      if (r.type === 'number') value = typeof r.value === 'number' ? r.value : Number(r.value) || 0
      else if (r.type === 'boolean') value = r.value === true
      else value = String(r.value ?? '')
      return { key: r.key.trim(), value }
    })
}

const rows = ref<Row[]>(fromModel(props.modelValue))

// re-sincroniza quando o pai troca a lista (ex.: tela de edição carrega async)
watch(
  () => props.modelValue,
  (v) => {
    if (JSON.stringify(toModel(rows.value)) !== JSON.stringify(v)) rows.value = fromModel(v)
  },
)

// emite a lista normalizada a cada alteração do usuário
watch(rows, () => emit('update:modelValue', toModel(rows.value)), { deep: true })

function addRow() {
  rows.value.push({ key: '', type: 'text', value: '' })
}
function removeRow(index: number) {
  rows.value.splice(index, 1)
}
function onTypeChange(row: Row) {
  row.value = row.type === 'number' ? 0 : row.type === 'boolean' ? false : ''
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium text-gray-700">Características (atributos)</span>
    <p v-if="rows.length === 0" class="text-sm text-gray-400">
      Nenhum atributo. Adicione características como projetor, computadores, acessibilidade…
    </p>

    <div v-for="(row, i) in rows" :key="i" class="flex items-center gap-2">
      <input
        v-model="row.key"
        :disabled="readonly"
        placeholder="chave (ex: projector)"
        class="w-1/3 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
      />
      <select
        v-model="row.type"
        :disabled="readonly"
        class="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
        @change="onTypeChange(row)"
      >
        <option value="text">Texto</option>
        <option value="number">Número</option>
        <option value="boolean">Sim/Não</option>
      </select>
      <input
        v-if="row.type === 'text'"
        v-model="row.value"
        :disabled="readonly"
        type="text"
        placeholder="valor"
        class="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
      />
      <input
        v-else-if="row.type === 'number'"
        v-model.number="row.value"
        :disabled="readonly"
        type="number"
        placeholder="0"
        class="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
      />
      <label v-else class="flex flex-1 items-center gap-2 text-sm text-gray-600">
        <input v-model="row.value" :disabled="readonly" type="checkbox" /> Sim
      </label>
      <button
        v-if="!readonly"
        type="button"
        class="px-2 text-red-600 hover:text-red-700"
        aria-label="Remover atributo"
        @click="removeRow(i)"
      >
        ✕
      </button>
    </div>

    <button
      v-if="!readonly"
      type="button"
      class="self-start text-sm font-medium text-primary-700 hover:underline"
      @click="addRow"
    >
      + Adicionar atributo
    </button>
  </div>
</template>
