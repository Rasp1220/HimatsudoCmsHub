/**
 * mirrors apps/himatsudo/src/utils/hubUrl.ts
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { resolveHubUrl } from '@/utils/hubUrl'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('resolveHubUrl', () => {
  it('本番（パスプレフィックス相乗り）では同一オリジンの / を返す', () => {
    expect(
      resolveHubUrl({ protocol: 'https:', hostname: 'admin.himatsudo.com', port: '' }),
    ).toBe('/')
  })

  it('vite dev server (5174) からはハブ入口ページのポート 5173 を指す', () => {
    expect(resolveHubUrl({ protocol: 'http:', hostname: 'localhost', port: '5174' })).toBe(
      'http://localhost:5173/',
    )
  })

  it('vite preview (4174) からはハブ入口ページのポート 4173 を指す', () => {
    expect(resolveHubUrl({ protocol: 'http:', hostname: '100.93.52.49', port: '4174' })).toBe(
      'http://100.93.52.49:4173/',
    )
  })

  it('VITE_HUB_URL が指定されていればそれを優先する', () => {
    vi.stubEnv('VITE_HUB_URL', 'https://cms-hub.example.com/')
    expect(resolveHubUrl({ protocol: 'http:', hostname: 'localhost', port: '5174' })).toBe(
      'https://cms-hub.example.com/',
    )
  })

  it('VITE_HUB_URL が空文字なら自動判定にフォールバックする', () => {
    vi.stubEnv('VITE_HUB_URL', '  ')
    expect(resolveHubUrl({ protocol: 'http:', hostname: 'localhost', port: '5174' })).toBe(
      'http://localhost:5173/',
    )
  })
})
