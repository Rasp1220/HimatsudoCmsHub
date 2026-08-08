/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API のベース URL（アップロード画像・プレビュー URL のオリジン解決に使用） */
  readonly VITE_API_BASE_URL?: string
  /** プレビューページの URL。未指定なら API と同じオリジンの /preview */
  readonly VITE_PREVIEW_URL?: string
  /** 統合CMSハブ入口ページの URL。未指定ならポートから自動判定（本番は同一オリジンの /） */
  readonly VITE_HUB_URL?: string
}
