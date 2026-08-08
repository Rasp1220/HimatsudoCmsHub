/**
 * 統合CMSハブ（入口ページ）の URL 解決。
 *
 * 本番（admin.himatsudo.com にパスプレフィックスで相乗り）ではハブは同一
 * オリジンの `/` にあるため相対パスでよい。一方、開発時の Vite dev server
 * （localhost:5174）や自宅サーバの `vite preview`（100.x.x.x:4174）へ直接
 * アクセスしている場合は、ハブが別ポート（5173 / 4173）で動いているため
 * 同じホストの該当ポートへリンクする。
 *
 * どちらにも当てはまらない構成（別ドメインでハブを運用するなど）は
 * `VITE_HUB_URL` で明示的に上書きできる。
 */

/** このアプリのポート → 同じ環境で動いているハブ入口ページのポート */
const HUB_PORT_BY_APP_PORT: Record<string, string> = {
  '5174': '5173', // vite dev server → bin/serve.php のハブ入口ページ
  '4174': '4173', // vite preview → himatsudocmshub-landing.service
}

export interface HubUrlLocation {
  protocol: string
  hostname: string
  port: string
}

export function resolveHubUrl(location: HubUrlLocation = window.location): string {
  const explicit = import.meta.env.VITE_HUB_URL?.trim()
  if (explicit) {
    return explicit
  }

  const hubPort = HUB_PORT_BY_APP_PORT[location.port]
  if (hubPort) {
    return `${location.protocol}//${location.hostname}:${hubPort}/`
  }

  return '/'
}
