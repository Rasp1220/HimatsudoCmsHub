<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminsApi } from '@/api/client'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => id.value !== null)

const form = reactive({ name: '', email: '', password: '' })

const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')

async function loadAdmin() {
  if (!id.value) return
  loading.value = true
  try {
    const admin = await adminsApi.get(id.value)
    form.name = admin.name
    form.email = admin.email
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  errorMsg.value = ''
  try {
    const payload = { name: form.name, email: form.email, ...(form.password ? { password: form.password } : {}) }
    if (isEdit.value && id.value) {
      await adminsApi.update(id.value, payload)
    } else {
      await adminsApi.create(payload)
    }
    router.push('/admins')
  } catch {
    errorMsg.value = '保存に失敗しました。メールアドレスの重複やパスワードの長さ（8文字以上）を確認してください。'
  } finally {
    saving.value = false
  }
}

onMounted(loadAdmin)
</script>

<template>
  <div class="max-w-md">
    <h2 class="text-xl font-bold text-gray-800 mb-6">{{ isEdit ? 'ユーザを編集' : 'ユーザを新規作成' }}</h2>

    <div v-if="loading" class="text-sm text-gray-400">読み込み中…</div>

    <form v-else @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">名前 <span class="text-red-500">*</span></label>
        <input v-model="form.name" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">メールアドレス <span class="text-red-500">*</span></label>
        <input v-model="form.email" type="email" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          パスワード <span v-if="!isEdit" class="text-red-500">*</span>
        </label>
        <input
          v-model="form.password"
          type="password"
          :required="!isEdit"
          autocomplete="new-password"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p class="text-xs text-gray-400 mt-1">
          {{ isEdit ? '変更する場合のみ入力（8文字以上）' : '8文字以上' }}
        </p>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{{ errorMsg }}</p>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" @click="router.push('/admins')" class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
          キャンセル
        </button>
        <button type="submit" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
          {{ saving ? '保存中…' : '保存する' }}
        </button>
      </div>
    </form>
  </div>
</template>
