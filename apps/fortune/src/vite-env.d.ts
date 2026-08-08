/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** HimatsudoFortune API のベース URL */
  readonly VITE_API_BASE_URL?: string
  /** 統合CMSハブ入口ページの URL。未指定ならポートから自動判定（本番は同一オリジンの /） */
  readonly VITE_HUB_URL?: string
}
