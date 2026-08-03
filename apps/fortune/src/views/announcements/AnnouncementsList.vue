<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { announcementsApi } from '@/api/client'
import type { Announcement } from '@/types'
import DataTable from '@/components/ui/DataTable.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const items = ref<Announcement[]>([])
const loading = ref(false)

const showDeleteModal = ref(false)
const deleteTarget = ref<Announcement | null>(null)

const columns = [
  { key: 'title', label: 'タイトル' },
  { key: 'tag', label: 'タグ', width: '120px' },
  { key: 'is_published', label: 'ステータス', width: '100px' },
  { key: 'published_on', label: '掲載日', width: '120px' },
  { key: 'actions', label: '', width: '120px' },
]

async function fetchList() {
  loading.value = true
  try {
    items.value = await announcementsApi.list()
  } finally {
    loading.value = false
  }
}

function confirmDelete(announcement: Announcement) {
  deleteTarget.value = announcement
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!deleteTarget.value) return
  await announcementsApi.delete(deleteTarget.value.id)
  deleteTarget.value = null
  await fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">お知らせ管理</h2>
      <RouterLink
        to="/announcements/new"
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
      >
        ＋ 新規作成
      </RouterLink>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-300">
      <DataTable :columns="columns" :rows="items" :loading="loading">
        <template #title="{ row }">
          <RouterLink
            :to="`/announcements/${(row as Announcement).id}/edit`"
            class="font-medium text-blue-700 hover:underline line-clamp-2"
          >{{ (row as Announcement).title }}</RouterLink>
        </template>
        <template #is_published="{ row }">
          <span
            class="px-2 py-0.5 text-xs font-medium rounded"
            :class="(row as Announcement).is_published
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'"
          >
            {{ (row as Announcement).is_published ? '公開' : '下書き' }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex gap-2">
            <RouterLink
              :to="`/announcements/${(row as Announcement).id}/edit`"
              class="text-blue-600 hover:underline text-xs font-medium"
            >
              編集
            </RouterLink>
            <button
              @click="confirmDelete(row as Announcement)"
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
      title="お知らせを削除"
      :message="`「${deleteTarget?.title}」を削除しますか？この操作は取り消せません。`"
      confirm-label="削除する"
      @confirm="executeDelete"
    />
  </div>
</template>
