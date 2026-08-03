<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const route = useRoute()
const isSidebarOpen = ref(false)

watch(() => route.fullPath, () => {
  isSidebarOpen.value = false
})
</script>

<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <AppSidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />
    <div class="flex flex-col flex-1 overflow-hidden">
      <AppHeader @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      <main
        class="flex-1 overflow-hidden"
        :class="route.meta.fullscreen ? 'overflow-hidden' : 'overflow-y-auto p-6'"
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>
