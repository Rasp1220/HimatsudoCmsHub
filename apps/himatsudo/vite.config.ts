import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'
import path from 'node:path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// npm workspaces（HimatsudoCmsHub）配下では tinymce がルートの node_modules に
// hoist されることがあるため、相対パスではなく実際の解決先から辿る。
const require = createRequire(import.meta.url)
const tinymceDir = path.dirname(require.resolve('tinymce/package.json'))

// Vite 5.4+ の host チェック対策。
// IP アドレス（例: Tailscale の 100.x.y.z）はデフォルトで許可されるが、
// MagicDNS のホスト名（machine.tailnet.ts.net）や独自ドメイン（例: cms.example.com）
// など IP 以外でアクセスすると "Blocked request. This host is not allowed." になる。
// Tailscale の MagicDNS ドメインを許可し、必要なら VITE_ALLOWED_HOSTS
// （カンマ区切り）で追加のホスト名（独自ドメインなど）を指定できるようにする。
const allowedHosts = [
  '.ts.net', // Tailscale MagicDNS（先頭ドットでサブドメインも一致）
  ...(process.env.VITE_ALLOWED_HOSTS
    ?.split(',')
    .map((h) => h.trim())
    .filter(Boolean) ?? []),
]

// API (public/index.php) へのプロキシ先。
// 開発時は composer serve が localhost:8080 にバインドするためデフォルトのままでよいが、
// 本番公開時（vite preview を自宅サーバーで常駐させる場合）はアプリが
// Tailscale IP にしかバインドしていないため、VITE_API_PROXY_TARGET で
// http://100.x.x.x:8080 のように上書きする。
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

export default defineConfig({
  // 統合CMSハブ (admin.himatsudo.com/himatsudo/) 配下でホストするためのベースパス。
  base: '/himatsudo/',
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: `${tinymceDir}/skins`,   dest: 'tinymce' },
        { src: `${tinymceDir}/plugins`, dest: 'tinymce' },
        { src: `${tinymceDir}/icons`,   dest: 'tinymce' },
        { src: `${tinymceDir}/models`,  dest: 'tinymce' },
        { src: `${tinymceDir}/themes`,  dest: 'tinymce' },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts,
    proxy: {
      '/admin/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  // 本番公開（自宅サーバ + VPSリバースプロキシ方式）時に `npm run build` の
  // 成果物を `vite preview` で常駐させるための設定。詳細は
  // HimatsudoCmsHub リポジトリの docs/deploy.md を参照。
  preview: {
    host: '0.0.0.0',
    port: 4174,
    allowedHosts,
    proxy: {
      '/admin/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
