<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { announcementsApi } from '@/api/client'
import type { AnnouncementFormData } from '@/types'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => id.value !== null)

const form = reactive<AnnouncementFormData>({
  published_on: new Date().toISOString().slice(0, 10),
  tag: 'お知らせ',
  title: '',
  body: '',
  is_published: true,
})

const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')

async function loadAnnouncement() {
  if (!id.value) return
  loading.value = true
  try {
    const announcement = await announcementsApi.get(id.value)
    form.published_on = announcement.published_on
    form.tag = announcement.tag
    form.title = announcement.title
    form.body = announcement.body
    form.is_published = Boolean(announcement.is_published)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  errorMsg.value = ''
  try {
    if (isEdit.value && id.value) {
      await announcementsApi.update(id.value, form)
    } else {
      await announcementsApi.create(form)
    }
    router.push('/announcements')
  } catch {
    errorMsg.value = '保存に失敗しました。掲載日の形式（YYYY-MM-DD）を確認してください。'
  } finally {
    saving.value = false
  }
}

onMounted(loadAnnouncement)
</script>

<template>
  <div class="max-w-2xl">
    <h2 class="text-xl font-bold text-gray-800 mb-6">{{ isEdit ? 'お知らせを編集' : 'お知らせを新規作成' }}</h2>

    <div v-if="loading" class="text-sm text-gray-400">読み込み中…</div>

    <form v-else @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">タイトル <span class="text-red-500">*</span></label>
        <input v-model="form.title" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">タグ</label>
        <input v-model="form.tag" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">本文 <span class="text-red-500">*</span></label>
        <textarea v-model="form.body" required rows="8" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
      </div>
      <div class="flex gap-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">掲載日 <span class="text-red-500">*</span></label>
          <input v-model="form.published_on" type="date" required class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none" />
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
        <button type="button" @click="router.push('/announcements')" class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
          キャンセル
        </button>
        <button type="submit" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
          {{ saving ? '保存中…' : '保存する' }}
        </button>
      </div>
    </form>
  </div>
</template>
