<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { adminsApi } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import type { Admin } from '@/types'
import DataTable from '@/components/ui/DataTable.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const auth = useAuthStore()

const items = ref<Admin[]>([])
const loading = ref(false)
const errorMsg = ref('')

const showDeleteModal = ref(false)
const deleteTarget = ref<Admin | null>(null)

const columns = [
  { key: 'name', label: '名前' },
  { key: 'email', label: 'メールアドレス' },
  { key: 'actions', label: '', width: '120px' },
]

// サーバー側と同じ「自分自身は削除不可」「最後の1人は削除不可」ガードをUIにも反映する
function canDelete(admin: Admin): boolean {
  if (admin.id === auth.user?.id) return false
  if (items.value.length <= 1) return false
  return true
}

async function fetchList() {
  loading.value = true
  try {
    items.value = await adminsApi.list()
  } finally {
    loading.value = false
  }
}

function confirmDelete(admin: Admin) {
  deleteTarget.value = admin
  showDeleteModal.value = true
}

const computedDeleteTargetName = computed(() => deleteTarget.value?.name)

async function executeDelete() {
  if (!deleteTarget.value) return
  errorMsg.value = ''
  try {
    await adminsApi.delete(deleteTarget.value.id)
    await fetchList()
  } catch {
    errorMsg.value = '削除に失敗しました。'
  } finally {
    deleteTarget.value = null
  }
}

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">ユーザ管理</h2>
      <RouterLink
        to="/admins/new"
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
      >
        ＋ ユーザを追加
      </RouterLink>
    </div>

    <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-4">{{ errorMsg }}</p>

    <div class="bg-white rounded-lg shadow-sm border border-gray-300">
      <DataTable :columns="columns" :rows="items" :loading="loading">
        <template #name="{ row }">
          <RouterLink
            :to="`/admins/${(row as Admin).id}/edit`"
            class="font-medium text-blue-700 hover:underline"
          >{{ (row as Admin).name }}</RouterLink>
          <span v-if="(row as Admin).id === auth.user?.id" class="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
            自分
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex gap-2">
            <RouterLink
              :to="`/admins/${(row as Admin).id}/edit`"
              class="text-blue-600 hover:underline text-xs font-medium"
            >
              編集
            </RouterLink>
            <button
              v-if="canDelete(row as Admin)"
              @click="confirmDelete(row as Admin)"
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
      title="ユーザを削除"
      :message="`「${computedDeleteTargetName}」を削除しますか？この操作は取り消せません。`"
      confirm-label="削除する"
      @confirm="executeDelete"
    />
  </div>
</template>
