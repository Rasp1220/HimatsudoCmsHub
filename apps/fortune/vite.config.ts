import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const allowedHosts = [
  '.ts.net', // Tailscale MagicDNS（先頭ドットでサブドメインも一致）
  ...(process.env.VITE_ALLOWED_HOSTS
    ?.split(',')
    .map((h) => h.trim())
    .filter(Boolean) ?? []),
]

// HimatsudoFortune の API (public/index.php) へのプロキシ先。
// 開発時は composer serve が localhost:8180 にバインドするためデフォルトのままでよい。
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8180'

export default defineConfig({
  // 統合CMSハブ (admin.himatsudo.com/fortune/) 配下でホストするためのベースパス。
  base: '/fortune/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
    allowedHosts,
    proxy: {
      '/api/admin': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4175,
    allowedHosts,
    proxy: {
      '/api/admin': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
