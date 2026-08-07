# 公開手順（自宅サーバ + VPS リバースプロキシ方式）

Himatsudo / HimatsudoFortune 本体を「自宅サーバでアプリを動かし、VPS を玄関口
（リバースプロキシ）にする」構成で公開しているのと同じ考え方を、CMS
（`admin.himatsudo.com`）にも適用する手順です。

`HimatsudoCmsHub/deploy/nginx-admin-himatsudo-com.conf`（ビルド成果物をVPSに
直接置いて静的配信する方式）よりも、Himatsudo / HimatsudoFortune と運用を
揃えたい場合に選んでください。どちらか一方の方式を選べばよく、両方を同時に
有効化しないでください（後述）。

## 全体構成

```
        インターネット
            │  https://admin.himatsudo.com
            ▼
   ┌─────────────────┐        Tailscale (暗号化された tailnet)
   │   VPS（玄関口）   │  ──────────────────────────────►  ┌──────────────────────┐
   │  - nginx        │   /            → 100.x.x.x:4173     │   自宅サーバ（本体）    │
   │  - TLS 終端      │   /himatsudo/  → 100.x.x.x:4174     │  - PHPビルトインサーバー│
   │  - 公開 IP       │   /fortune/    → 100.x.x.x:4175     │    (ハブ入口ページ)    │
   │  （リポジトリ・   │                                    │  - vite preview ×2    │
   │   ファイル配置    │                                    │    (ビルド済み静的資産) │
   │   一切なし）      │                                    └──────────────────────┘
   └─────────────────┘
```

- `/` `/himatsudo/` `/fortune/` はすべて自宅サーバ上で常駐するプロセスへ
  リバースプロキシする。**VPS側にはこのリポジトリを一切置かない**
  （Himatsudo / HimatsudoFortune 本体と同じ運用）。nginx confファイルだけを
  VPSに配置すれば完結する。
- ハブ入口ページ（`/`）はビルド不要の単一静的HTMLなので、PHPビルトイン
  サーバーで配信するだけの軽量プロセスとして自宅サーバ側に置く。
- CMSからバックエンドAPI（Himatsudo / HimatsudoFortune）へのリクエストは、
  ブラウザから直接それぞれのバックエンドドメインへクロスオリジンで行われる。
  この構成のnginx/vite previewはAPIをプロキシしない。

> 前提: Himatsudo / HimatsudoFortune 本体が、それぞれの `docs/deploy.md` /
> `docs/DEPLOY.md` の手順で既に自宅サーバ + VPS 構成で公開済みであること。
> 自宅サーバ側で Tailscale 導入済み・`tailscale ip -4` で自身のIPを確認できる状態。

---

## A. 自宅サーバ側でやること

### A-1. 依存パッケージ

```bash
cd ~/HimatsudoCmsHub
npm install
```

### A-2. 各CMSアプリの `.env` を作成してビルド

```bash
cd apps/himatsudo
cp .env.example .env
```
```dotenv
VITE_API_BASE_URL=https://<Himatsudo公開ドメイン>/admin/api
```
```bash
npm run build   # → dist/
cd ..

cd apps/fortune
cp .env.example .env
```
```dotenv
VITE_API_BASE_URL=https://fortune.himatsudo.com/api/admin
```
```bash
npm run build   # → dist/
cd ..
```

### A-3. ハブ入口ページ・`vite preview` を Tailscale IP で常駐させる

`deploy/home/himatsudocmshub-landing.service`、
`deploy/home/himatsudocmshub-himatsudo.service`、
`deploy/home/himatsudocmshub-fortune.service` を雛形として利用する。

```bash
sudo cp deploy/home/himatsudocmshub-landing.service /etc/systemd/system/
sudo cp deploy/home/himatsudocmshub-himatsudo.service /etc/systemd/system/
sudo cp deploy/home/himatsudocmshub-fortune.service /etc/systemd/system/
sudo nano /etc/systemd/system/himatsudocmshub-landing.service
sudo nano /etc/systemd/system/himatsudocmshub-himatsudo.service
sudo nano /etc/systemd/system/himatsudocmshub-fortune.service
#   youruser / パス / 100.x.x.x（自分の Tailscale IP）を置換

sudo systemctl daemon-reload
sudo systemctl enable --now himatsudocmshub-landing
sudo systemctl enable --now himatsudocmshub-himatsudo
sudo systemctl enable --now himatsudocmshub-fortune
systemctl status himatsudocmshub-landing himatsudocmshub-himatsudo himatsudocmshub-fortune   # active (running) を確認
```

### A-4. 自宅サーバ単体で動作確認

```bash
curl -I http://100.x.x.x:4173/            # 200 が返ればOK（ハブ入口ページ）
curl -I http://100.x.x.x:4174/himatsudo/   # 200 が返ればOK
curl -I http://100.x.x.x:4175/fortune/     # 200 が返ればOK
```

---

## B. VPS 側でやること

VPSにはこのリポジトリを置く必要はありません。nginx confファイルを1つ配置するだけです。

### B-1. nginx を導入してリバースプロキシ設定

```bash
sudo cp deploy/vps/nginx-admin-himatsudo-com.conf /etc/nginx/sites-available/admin-himatsudo-com.conf
sudo nano /etc/nginx/sites-available/admin-himatsudo-com.conf
#   100.x.x.x → 自宅サーバの Tailscale IP に置換
sudo ln -s /etc/nginx/sites-available/admin-himatsudo-com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### B-2. TLS 証明書（Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d admin.himatsudo.com
```

### B-3. Basic 認証（推奨）

管理画面を無防備にインターネット公開することになるため、併用を強く推奨。

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd <ユーザー名>
```
`deploy/vps/nginx-admin-himatsudo-com.conf` 内のコメントアウトされた
`auth_basic` 行を有効化して `nginx -t && systemctl reload nginx`。

---

## C. バックエンド側のCORS確認

- `Himatsudo/.env` の `CMS_HUB_ORIGIN`（既定値 `https://admin.himatsudo.com` なので通常は未設定でOK）
- `HimatsudoFortune/.env` の `CORS_ALLOWED_ORIGINS` に `https://admin.himatsudo.com` を含める
  （`.env.example` の既定値 `*` のままにしない）

---

## D. 最終確認

```bash
curl -I https://admin.himatsudo.com/
curl -I https://admin.himatsudo.com/himatsudo/
curl -I https://admin.himatsudo.com/fortune/
```

ブラウザで各URLを開き、ログイン〜データ取得まで確認する（DevToolsでCORSエラーが
出ていないか、API呼び出しが各バックエンドドメインに正しく飛んでいるか確認）。

---

## E. コードを更新する（`git pull` 後の反映）

`vite preview` はビルド済みの静的ファイルを配信しているだけなので、コード変更を
反映するには再ビルド + 再起動が必要（PHPアプリのような自動反映はされない）。
ハブ入口ページ（`public/index.html`）はPHPビルトインサーバーがリクエストごとに
読み直すため、`git pull` だけで反映され再起動は不要。

```bash
cd ~/HimatsudoCmsHub
git pull origin main
npm install                     # package.json が変わった場合のみ

cd apps/himatsudo && npm run build && cd ..
sudo systemctl restart himatsudocmshub-himatsudo

cd apps/fortune && npm run build && cd ..
sudo systemctl restart himatsudocmshub-fortune
```

---

## 静的ファイル直配信方式との併用について

`deploy/nginx-admin-himatsudo-com.conf`（リポジトリ直下）は、ビルド成果物や
`public/index.html` をVPSに直接置いて nginx が `alias` / `root` で静的配信する
もう一つの方式です。**この docs/deploy.md の方式（`deploy/vps/nginx-admin-himatsudo-com.conf`、
VPSにはファイルを一切置かずすべて自宅サーバへプロキシする方式）とは
`server_name admin.himatsudo.com` が重複するため、同時に `sites-enabled` へ
配置しないでください。** どちらか一方だけを有効化してください。

---

## トラブルシュート

| 症状 | 確認ポイント |
|------|-------------|
| VPS から自宅に繋がらない | 両機が同じ tailnet か（`tailscale status`）、自宅で対象の`.service`が active か |
| 502 Bad Gateway | nginx の `proxy_pass` の IP/ポートが自宅の Tailscale IP と一致しているか、対象プロセスが実際に4173/4174/4175で待ち受けているか（`ss -tlnp \| grep -E '4173\|4174\|4175'`） |
| ログインできない・CORSエラー | 呼び出し先バックエンドの `CMS_HUB_ORIGIN` / `CORS_ALLOWED_ORIGINS` に `https://admin.himatsudo.com` が入っているか |
| コードを更新したのに反映されない | `npm run build` → `systemctl restart` を忘れていないか（静的配信のため自動反映されない） |
| `himatsudocmshub-*.service` が起動しない/落ちる | `WorkingDirectory` / `ExecStart` のパスにテンプレートの `youruser` 等のプレースホルダーが残っていないか |
