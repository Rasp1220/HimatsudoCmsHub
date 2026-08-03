<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineEmits<{ 'toggle-sidebar': [] }>()

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const pageTitles: Record<string, string> = {
  Dashboard: 'ダッシュボード',
  ColumnsList: 'コラム管理',
  ColumnNew: 'コラム 新規作成',
  ColumnEdit: 'コラム 編集',
  AnnouncementsList: 'お知らせ管理',
  AnnouncementNew: 'お知らせ 新規作成',
  AnnouncementEdit: 'お知らせ 編集',
  AdminsList: 'ユーザ管理',
  AdminNew: 'ユーザ 新規作成',
  AdminEdit: 'ユーザ 編集',
}

const pageTitle = computed(() => pageTitles[String(route.name ?? '')] ?? 'CMS')

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <button
        type="button"
        class="md:hidden text-gray-500 hover:text-gray-800 flex-shrink-0"
        aria-label="メニューを開く"
        @click="$emit('toggle-sidebar')"
      >
        <span class="text-2xl leading-none">☰</span>
      </button>
      <h1 class="text-lg font-semibold text-gray-700 truncate">{{ pageTitle }}</h1>
    </div>
    <div class="flex items-center gap-4">
      <span v-if="auth.user" class="text-sm text-gray-500">{{ auth.user.name }}</span>
      <button
        @click="handleLogout"
        class="text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        ログアウト
      </button>
    </div>
  </header>
</template>
