<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { columnsApi } from '@/api/client'
import type { Column } from '@/types'
import DataTable from '@/components/ui/DataTable.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const items = ref<Column[]>([])
const loading = ref(false)

const showDeleteModal = ref(false)
const deleteTarget = ref<Column | null>(null)

const columns = [
  { key: 'title', label: 'タイトル' },
  { key: 'category', label: 'カテゴリ', width: '140px' },
  { key: 'is_published', label: 'ステータス', width: '100px' },
  { key: 'published_at', label: '公開日', width: '120px' },
  { key: 'actions', label: '', width: '120px' },
]

async function fetchList() {
  loading.value = true
  try {
    items.value = await columnsApi.list()
  } finally {
    loading.value = false
  }
}

function confirmDelete(column: Column) {
  deleteTarget.value = column
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!deleteTarget.value) return
  await columnsApi.delete(deleteTarget.value.id)
  deleteTarget.value = null
  await fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">コラム管理</h2>
      <RouterLink
        to="/columns/new"
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
      >
        ＋ 新規作成
      </RouterLink>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-300">
      <DataTable :columns="columns" :rows="items" :loading="loading">
        <template #title="{ row }">
          <RouterLink
            :to="`/columns/${(row as Column).id}/edit`"
            class="font-medium text-blue-700 hover:underline line-clamp-2"
          >{{ (row as Column).title }}</RouterLink>
        </template>
        <template #is_published="{ row }">
          <span
            class="px-2 py-0.5 text-xs font-medium rounded"
            :class="(row as Column).is_published
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'"
          >
            {{ (row as Column).is_published ? '公開' : '下書き' }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex gap-2">
            <RouterLink
              :to="`/columns/${(row as Column).id}/edit`"
              class="text-blue-600 hover:underline text-xs font-medium"
            >
              編集
            </RouterLink>
            <button
              @click="confirmDelete(row as Column)"
              class="text-red-500 hover:underline text-xs font-medium"
            >
              削除
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <ConfirmModal
      v-model="showDeleteModal"
      title="コラムを削除"
      :message="`「${deleteTarget?.title}」を削除しますか？この操作は取り消せません。`"
      confirm-label="削除する"
      @confirm="executeDelete"
    />
  </div>
</template>
