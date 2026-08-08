<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { resolveHubUrl } from '@/utils/hubUrl'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const hubUrl = resolveHubUrl()

const navItems = [
  { name: 'Dashboard', label: 'ダッシュボード', icon: '🏠', to: '/dashboard' },
  { name: 'ArticlesList', label: '記事管理', icon: '📝', to: '/articles' },
  { name: 'Categories', label: 'カテゴリ管理', icon: '🗂️', to: '/categories' },
  { name: 'Users', label: 'ユーザー管理', icon: '👤', to: '/users' },
  { name: 'Profile', label: 'プロフィール設定', icon: '⚙️', to: '/profile' },
]

function isActive(name: string): boolean {
  const routeName = String(route.name ?? '')
  if (name === 'ArticlesList') {
    return routeName.startsWith('Article') || routeName.startsWith('Youtube')
  }
  return routeName === name
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-30 bg-black/50 md:hidden"
    @click="emit('close')"
  />
  <aside
    class="fixed inset-y-0 left-0 z-40 w-60 bg-slate-800 text-white flex flex-col flex-shrink-0 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
      <div>
        <span class="text-xl font-bold tracking-wide">Himatsudo</span>
        <span class="block text-xs text-slate-400 mt-0.5">CMS</span>
      </div>
      <button
        type="button"
        class="md:hidden text-slate-300 hover:text-white"
        aria-label="メニューを閉じる"
        @click="emit('close')"
      >
        <span class="text-xl">✕</span>
      </button>
    </div>
    <a
      :href="hubUrl"
      class="flex items-center gap-2 px-6 py-2.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-white border-b border-slate-700 transition-colors"
    >
      <span class="text-sm leading-none">←</span>
      統合CMSハブへ戻る
    </a>
    <nav class="flex-1 py-4 overflow-y-auto">
      <ul class="space-y-1 px-3">
        <li v-for="item in navItems" :key="item.name">
          <RouterLink
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="isActive(item.name)
              ? 'bg-slate-700 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'"
          >
            <span class="text-base">{{ item.icon }}</span>
            {{ item.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>
