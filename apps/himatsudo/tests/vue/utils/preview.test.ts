/**
 * mirrors cms/src/utils/preview.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Article, Category, User } from '@/types'

const CMS_ORIGIN = 'http://localhost:3000' // jsdom の既定オリジン

const categories: Category[] = [
  {
    id: 3,
    name: 'ブログ',
    slug: 'blog',
    type: 'blog',
    sort_order: 1,
    created_at: '2026-01-01 00:00:00',
    updated_at: '2026-01-01 00:00:00',
  },
]

const author: User = {
  id: 7,
  name: '管理者',
  email: 'admin@example.com',
  role: 'admin',
  created_at: '2026-01-01 00:00:00',
  updated_at: '2026-01-01 00:00:00',
}

const relatedArticle = {
  id: 42,
  title: '関連記事',
  slug: 'related',
  content: null,
  blocks: null,
  excerpt: null,
  eye_catch_image: '/uploads/related.png',
  category_id: 3,
  category_name: 'ブログ',
  category_type: 'blog',
  author_id: 7,
  author_name: '管理者',
  status: 'published',
  youtube_url: null,
  youtube_video_id: null,
  youtube_thumbnail: null,
  related_article_ids: null,
  published_at: '2026-07-01 09:00:00',
  created_at: '2026-07-01 09:00:00',
  updated_at: '2026-07-01 09:00:00',
} as Article

const baseForm = {
  title: 'テスト記事',
  slug: 'test-article',
  status: 'draft' as const,
  published_at: '',
  eye_catch_image: '/uploads/eyecatch.png',
  category_id: 3,
  blocks: '[]',
}

function makeInput(overrides: Record<string, unknown> = {}) {
  return {
    previewId: 'article-1',
    form: { ...baseForm },
    categories,
    author,
    relatedArticles: [relatedArticle],
    ...overrides,
  }
}

/** モジュール内の state（ブリッジ登録済みフラグ）をテストごとに初期化する */
async function importPreview() {
  vi.resetModules()
  return import('@/utils/preview')
}

beforeEach(() => {
  localStorage.clear()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buildPreviewPayload', () => {
  it('フォームの内容をフロント側テンプレートのキー構成へ変換する', async () => {
    const { buildPreviewPayload, PREVIEW_PAYLOAD_VERSION } = await importPreview()
    const payload = buildPreviewPayload(makeInput())

    expect(payload.version).toBe(PREVIEW_PAYLOAD_VERSION)
    expect(payload.article.title).toBe('テスト記事')
    expect(payload.article.slug).toBe('test-article')
    expect(payload.article.eye_catch_image).toBe('/uploads/eyecatch.png')
    expect(payload.article.blocks).toBe('[]')
    expect(payload.article.content).toBe('')
  })

  it('カテゴリIDから名前・スラッグ・タイプを解決する', async () => {
    const { buildPreviewPayload } = await importPreview()
    const payload = buildPreviewPayload(makeInput())

    expect(payload.article.category_name).toBe('ブログ')
    expect(payload.article.category_slug).toBe('blog')
    expect(payload.article.category_type).toBe('blog')
  })

  it('カテゴリ未選択ならカテゴリ情報は null になる', async () => {
    const { buildPreviewPayload } = await importPreview()
    const payload = buildPreviewPayload(makeInput({ form: { ...baseForm, category_id: null } }))

    expect(payload.article.category_id).toBeNull()
    expect(payload.article.category_name).toBeNull()
    expect(payload.article.category_type).toBeNull()
  })

  it('ログインユーザーを著者として埋める', async () => {
    const { buildPreviewPayload } = await importPreview()
    const payload = buildPreviewPayload(makeInput())

    expect(payload.article.author_id).toBe(7)
    expect(payload.article.author_name).toBe('管理者')
  })

  it('未ログインでも著者なしで生成できる', async () => {
    const { buildPreviewPayload } = await importPreview()
    const payload = buildPreviewPayload(makeInput({ author: null }))

    expect(payload.article.author_id).toBeNull()
    expect(payload.article.author_name).toBeNull()
  })

  it('入力された公開日時を DB と同じ形式へ変換する', async () => {
    const { buildPreviewPayload } = await importPreview()
    const payload = buildPreviewPayload(
      makeInput({ form: { ...baseForm, published_at: '2026-07-29T10:30' } }),
    )

    expect(payload.article.published_at).toBe('2026-07-29 10:30:00')
  })

  it('下書きで公開日時が未入力なら null（フロント側で日付を出さない）', async () => {
    const { buildPreviewPayload } = await importPreview()
    const payload = buildPreviewPayload(makeInput())

    expect(payload.article.published_at).toBeNull()
  })

  it('公開ステータスで未入力なら保存時と同じく現在時刻を補う', async () => {
    const { buildPreviewPayload } = await importPreview()
    const now = new Date(2026, 6, 29, 10, 30, 5)
    const payload = buildPreviewPayload(
      makeInput({ form: { ...baseForm, status: 'published' } }),
      now,
    )

    expect(payload.article.published_at).toBe('2026-07-29 10:30:05')
  })

  it('関連記事は表示に必要な項目だけを持ち出す', async () => {
    const { buildPreviewPayload } = await importPreview()
    const payload = buildPreviewPayload(makeInput())

    expect(payload.related_articles).toEqual([
      {
        id: 42,
        title: '関連記事',
        slug: 'related',
        category_name: 'ブログ',
        category_type: 'blog',
        eye_catch_image: '/uploads/related.png',
        youtube_thumbnail: null,
        published_at: '2026-07-01 09:00:00',
      },
    ])
  })
})

describe('resolvePreviewUrl', () => {
  it('既定では API と同じオリジンの /preview を使う', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://example.com/admin/api')
    const { resolvePreviewUrl } = await importPreview()

    expect(resolvePreviewUrl()).toBe('https://example.com/preview')
  })

  it('VITE_PREVIEW_URL が指定されていればそれを優先する', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://example.com/admin/api')
    vi.stubEnv('VITE_PREVIEW_URL', 'https://www.example.net/preview/')
    const { resolvePreviewUrl } = await importPreview()

    expect(resolvePreviewUrl()).toBe('https://www.example.net/preview')
  })
})

describe('buildPreviewTabUrl', () => {
  it('キーと CMS のオリジンをハッシュに載せる（サーバーへは送られない）', async () => {
    const { buildPreviewTabUrl } = await importPreview()
    const url = new URL(buildPreviewTabUrl('article-1', 'https://example.com/preview'))

    expect(url.origin + url.pathname).toBe('https://example.com/preview')
    expect(url.hash).toBe(`#k=article-1&o=${encodeURIComponent(CMS_ORIGIN)}`)
    expect(url.searchParams.get('t')).toMatch(/^\d+$/)
  })
})

describe('openArticlePreview', () => {
  it('localStorage へ保存し、記事ごとのタブ名で別タブを開く', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://example.com/admin/api')
    const open = vi.fn(() => ({}) as Window)
    vi.stubGlobal('open', open)

    const { openArticlePreview, previewStorageKey } = await importPreview()
    const result = openArticlePreview(makeInput())

    expect(result).toEqual({ ok: true })

    const stored = localStorage.getItem(previewStorageKey('article-1'))
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored as string).article.title).toBe('テスト記事')

    expect(open).toHaveBeenCalledTimes(1)
    const [url, target] = open.mock.calls[0] as unknown as [string, string]
    expect(url).toContain('https://example.com/preview')
    expect(url).toContain('#k=article-1')
    expect(target).toBe('himatsudo-preview-article-1')
  })

  it('ポップアップがブロックされたらエラーメッセージを返す', async () => {
    vi.stubGlobal('open', vi.fn(() => null))
    const { openArticlePreview } = await importPreview()

    const result = openArticlePreview(makeInput())

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.message).toContain('ポップアップ')
  })

  it('localStorage に保存できない場合はタブを開かずエラーを返す', async () => {
    const open = vi.fn(() => ({}) as Window)
    vi.stubGlobal('open', open)
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const { openArticlePreview } = await importPreview()
    const result = openArticlePreview(makeInput())

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.message).toContain('保存')
    expect(open).not.toHaveBeenCalled()
  })
})

describe('startPreviewBridge', () => {
  const previewOrigin = 'https://example.com'

  function dispatchRequest(origin: string, data: unknown, source: unknown) {
    const event = new MessageEvent('message', { data, origin })
    Object.defineProperty(event, 'source', { value: source })
    window.dispatchEvent(event)
  }

  it('プレビュータブからの要求に保存済みデータを返す', async () => {
    const { startPreviewBridge, previewStorageKey, PREVIEW_REQUEST_TYPE, PREVIEW_RESPONSE_TYPE } =
      await importPreview()
    localStorage.setItem(previewStorageKey('article-1'), '{"article":{}}')
    startPreviewBridge(previewOrigin)

    const source = { postMessage: vi.fn() }
    dispatchRequest(previewOrigin, { type: PREVIEW_REQUEST_TYPE, key: 'article-1' }, source)

    expect(source.postMessage).toHaveBeenCalledWith(
      { type: PREVIEW_RESPONSE_TYPE, key: 'article-1', payload: '{"article":{}}' },
      previewOrigin,
    )
  })

  it('別オリジンからの要求には応答しない', async () => {
    const { startPreviewBridge, PREVIEW_REQUEST_TYPE } = await importPreview()
    startPreviewBridge(previewOrigin)

    const source = { postMessage: vi.fn() }
    dispatchRequest('https://evil.example', { type: PREVIEW_REQUEST_TYPE, key: 'article-1' }, source)

    expect(source.postMessage).not.toHaveBeenCalled()
  })

  it('種別の異なるメッセージには応答しない', async () => {
    const { startPreviewBridge } = await importPreview()
    startPreviewBridge(previewOrigin)

    const source = { postMessage: vi.fn() }
    dispatchRequest(previewOrigin, { type: 'something-else', key: 'article-1' }, source)

    expect(source.postMessage).not.toHaveBeenCalled()
  })

  it('未保存のキーには null を返す', async () => {
    const { startPreviewBridge, PREVIEW_REQUEST_TYPE, PREVIEW_RESPONSE_TYPE } = await importPreview()
    startPreviewBridge(previewOrigin)

    const source = { postMessage: vi.fn() }
    dispatchRequest(previewOrigin, { type: PREVIEW_REQUEST_TYPE, key: 'unknown' }, source)

    expect(source.postMessage).toHaveBeenCalledWith(
      { type: PREVIEW_RESPONSE_TYPE, key: 'unknown', payload: null },
      previewOrigin,
    )
  })
})
