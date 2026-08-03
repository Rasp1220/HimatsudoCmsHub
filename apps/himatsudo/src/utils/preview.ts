/**
 * 記事プレビュー（DB 未保存）の書き出しとプレビュータブの起動。
 *
 * 編集中のフォーム内容を JSON 化して localStorage に保存し、公開サイト側の
 * `/preview` を別タブで開く。サーバーには一切送信しない。
 *
 * CMS（例: cms.example.com / localhost:5173）と公開サイト（例: example.com /
 * localhost:8080）はオリジンが異なり localStorage を共有できないため、
 * プレビュー側から postMessage で要求が来たら保存済み JSON を返す
 * ブリッジも合わせて用意する。オリジンは双方向で厳密に検証する。
 */
import type {
  Article,
  ArticleStatus,
  Category,
  PreviewPayload,
  PreviewRelatedArticle,
  User,
} from '@/types'

export const PREVIEW_STORAGE_PREFIX = 'himatsudo:preview:'
export const PREVIEW_PAYLOAD_VERSION = 1
export const PREVIEW_REQUEST_TYPE = 'himatsudo:preview:request'
export const PREVIEW_RESPONSE_TYPE = 'himatsudo:preview:data'

const DEFAULT_API_BASE_URL = 'http://localhost:8080/admin/api'

export interface PreviewFormInput {
  title: string
  slug: string
  status: ArticleStatus
  /** datetime-local の値（例: '2026-07-29T10:30'） */
  published_at: string
  eye_catch_image: string
  category_id: number | null
  content?: string
  blocks?: string
  youtube_url?: string
  youtube_video_id?: string
  youtube_thumbnail?: string
}

export interface PreviewInput {
  /** 編集対象ごとに一意なID。同じIDなら同じタブを再利用する（例: 'article-12'） */
  previewId: string
  form: PreviewFormInput
  categories: Category[]
  author: User | null
  relatedArticles: Article[]
}

export type PreviewOpenResult = { ok: true } | { ok: false; message: string }

export function previewStorageKey(previewId: string): string {
  return `${PREVIEW_STORAGE_PREFIX}${previewId}`
}

/** datetime-local の値を DB と同じ 'Y-m-d H:i:s' 形式へ。 */
function toDbDateTime(inputDate: string): string | null {
  if (!inputDate) return null
  return `${inputDate.replace('T', ' ')}:00`
}

function nowDbDateTime(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

function toPreviewRelated(article: Article): PreviewRelatedArticle {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    category_name: article.category_name,
    category_type: article.category_type,
    eye_catch_image: article.eye_catch_image,
    youtube_thumbnail: article.youtube_thumbnail,
    published_at: article.published_at,
  }
}

/**
 * プレビューページの URL。既定では API と同じオリジン（＝公開サイト）の
 * `/preview`。CMS と公開サイトを別ドメインで運用する場合は
 * `VITE_PREVIEW_URL` で明示的に指定する。
 */
export function resolvePreviewUrl(): string {
  const explicit = import.meta.env.VITE_PREVIEW_URL
  if (explicit) {
    return explicit.replace(/\/+$/, '')
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
  try {
    return `${new URL(apiBase).origin}/preview`
  } catch {
    return '/preview'
  }
}

/** 編集中のフォーム内容を、フロント側テンプレートと同じキー構成に整形する。 */
export function buildPreviewPayload(input: PreviewInput, now = new Date()): PreviewPayload {
  const { form } = input
  const category = input.categories.find((c) => c.id === form.category_id) ?? null
  const publishedAt = toDbDateTime(form.published_at)

  return {
    version: PREVIEW_PAYLOAD_VERSION,
    saved_at: now.toISOString(),
    article: {
      title: form.title,
      slug: form.slug,
      status: form.status,
      content: form.content ?? '',
      blocks: form.blocks ?? '',
      eye_catch_image: form.eye_catch_image,
      category_id: form.category_id,
      category_name: category?.name ?? null,
      category_slug: category?.slug ?? null,
      category_type: category?.type ?? null,
      author_id: input.author?.id ?? null,
      author_name: input.author?.name ?? null,
      youtube_url: form.youtube_url ?? '',
      youtube_video_id: form.youtube_video_id ?? '',
      youtube_thumbnail: form.youtube_thumbnail ?? '',
      // 公開日時が未入力のまま「公開」で保存すると API 側で現在時刻が入るため、
      // プレビューでも同じ見え方になるよう合わせる（下書きは日付を出さない）。
      published_at: publishedAt ?? (form.status === 'published' ? nowDbDateTime(now) : null),
    },
    related_articles: input.relatedArticles.map(toPreviewRelated),
  }
}

/** プレビュータブへ渡す URL。記事データはハッシュに載せず localStorage 経由で渡す。 */
export function buildPreviewTabUrl(previewId: string, baseUrl = resolvePreviewUrl()): string {
  const url = new URL(baseUrl, window.location.href)
  // 同じタブを再利用したときに確実に再読み込みさせる
  url.searchParams.set('t', String(Date.now()))
  url.hash = `k=${encodeURIComponent(previewId)}&o=${encodeURIComponent(window.location.origin)}`
  return url.toString()
}

let bridgeOrigin: string | null = null
let bridgeAttached = false

function handlePreviewRequest(event: MessageEvent): void {
  if (bridgeOrigin === null || event.origin !== bridgeOrigin) return

  const data = event.data as { type?: unknown; key?: unknown } | null
  if (!data || data.type !== PREVIEW_REQUEST_TYPE || typeof data.key !== 'string') return

  const source = event.source as Window | null
  if (!source) return

  source.postMessage(
    {
      type: PREVIEW_RESPONSE_TYPE,
      key: data.key,
      payload: localStorage.getItem(previewStorageKey(data.key)),
    },
    bridgeOrigin,
  )
}

/** 別オリジンのプレビュータブからのデータ要求に応答できるようにする。 */
export function startPreviewBridge(origin: string): void {
  bridgeOrigin = origin
  if (bridgeAttached) return
  window.addEventListener('message', handlePreviewRequest)
  bridgeAttached = true
}

/**
 * 編集中の内容を localStorage に保存し、プレビュー用タブを開く。
 * 同じ previewId のタブが既にあれば、そのタブを再利用して最新内容を表示する。
 */
export function openArticlePreview(input: PreviewInput): PreviewOpenResult {
  const payload = buildPreviewPayload(input)

  try {
    localStorage.setItem(previewStorageKey(input.previewId), JSON.stringify(payload))
  } catch {
    return {
      ok: false,
      message: 'プレビューデータを保存できませんでした。ブラウザの保存容量を確認してください。',
    }
  }

  const baseUrl = resolvePreviewUrl()
  // プレビュータブが読み込み直後に要求を送ってくるため、開く前に応答側を用意する
  startPreviewBridge(new URL(baseUrl, window.location.href).origin)

  const opened = window.open(
    buildPreviewTabUrl(input.previewId, baseUrl),
    `himatsudo-preview-${input.previewId}`,
  )
  if (!opened) {
    return {
      ok: false,
      message: 'プレビュータブを開けませんでした。ポップアップブロックを解除してください。',
    }
  }

  return { ok: true }
}
