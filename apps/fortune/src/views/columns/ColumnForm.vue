<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { columnsApi } from '@/api/client'
import type { ColumnFormData } from '@/types'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => id.value !== null)

const form = reactive<ColumnFormData>({
  slug: '',
  title: '',
  category: '',
  excerpt: '',
  body: '',
  published_at: new Date().toISOString().slice(0, 10),
  is_published: true,
})

const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')

async function loadColumn() {
  if (!id.value) return
  loading.value = true
  try {
    const column = await columnsApi.get(id.value)
    form.slug = column.slug
    form.title = column.title
    form.category = column.category
    form.excerpt = column.excerpt
    form.body = column.body
    form.published_at = column.published_at
    form.is_published = Boolean(column.is_published)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  errorMsg.value = ''
  try {
    if (isEdit.value && id.value) {
      await columnsApi.update(id.value, form)
    } else {
      await columnsApi.create(form)
    }
    router.push('/columns')
  } catch {
    errorMsg.value = '保存に失敗しました。入力内容（スラッグの形式・重複など）を確認してください。'
  } finally {
    saving.value = false
  }
}

onMounted(loadColumn)
</script>

<template>
  <div class="max-w-2xl">
    <h2 class="text-xl font-bold text-gray-800 mb-6">{{ isEdit ? 'コラムを編集' : 'コラムを新規作成' }}</h2>

    <div v-if="loading" class="text-sm text-gray-400">読み込み中…</div>

    <form v-else @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">タイトル <span class="text-red-500">*</span></label>
        <input v-model="form.title" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">スラッグ（URL識別子） <span class="text-red-500">*</span></label>
        <input v-model="form.slug" required pattern="[a-z0-9\-]+" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none font-mono" />
        <p class="text-xs text-gray-400 mt-1">半角英小文字・数字・ハイフンのみ</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">カテゴリ <span class="text-red-500">*</span></label>
        <input v-model="form.category" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">概要</label>
        <textarea v-model="form.excerpt" rows="2" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">本文 <span class="text-red-500">*</span></label>
        <textarea v-model="form.body" required rows="10" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
      </div>
      <div class="flex gap-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">公開日</label>
          <input v-model="form.published_at" type="date" class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none" />
        </div>
        <div class="flex items-end pb-2">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.is_published" type="checkbox" class="rounded border-gray-300" />
            公開する
          </label>
        </div>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{{ errorMsg }}</p>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" @click="router.push('/columns')" class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
          キャンセル
        </button>
        <button type="submit" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
          {{ saving ? '保存中…' : '保存する' }}
        </button>
      </div>
    </form>
  </div>
</template>
