# HimatsudoCmsHub

Himatsudo（記事CMS）と HimatsudoFortune（占いサービス）の管理画面（CMS）を
1つのハブにまとめた統合CMSです。

- `admin.himatsudo.com/himatsudo/` — Himatsudo の記事・カテゴリ・ユーザー管理
- `admin.himatsudo.com/fortune/` — HimatsudoFortune のコラム・お知らせ・ユーザー管理

各アプリは独立したVue 3 + TypeScript SPAで、それぞれ自身のバックエンドAPI
（Himatsudo / HimatsudoFortune）に対してJWT認証付きREST APIで通信します。
DB接続は各サービスの既存バックエンドがそのまま担い、このハブはUI層の統合のみを行います。

## リポジトリ構成

```
HimatsudoCmsHub/
  apps/
    himatsudo/   # Himatsudo管理画面 (base: /himatsudo/)
    fortune/     # HimatsudoFortune管理画面 (base: /fortune/)
  bin/serve.php  # 開発用オーケストレーター
  deploy/        # 本番デプロイ設定のサンプル
```

## 前提

`Himatsudo` / `HimatsudoFortune` / `HimatsudoCmsHub` の3リポジトリを
兄弟ディレクトリとしてチェックアウトしておく必要があります。

```
some-dir/
  Himatsudo/
  HimatsudoFortune/
  HimatsudoCmsHub/   ← このリポジトリ
```

## セットアップ

```bash
# 各バックエンドの依存関係とDBを準備
cd ../Himatsudo && composer install && composer setup
cd ../HimatsudoFortune && composer install && composer setup

# ハブ側（2つのVueアプリ）の依存関係をまとめてインストール
cd ../HimatsudoCmsHub
npm install
```

`apps/himatsudo/.env.example` と `apps/fortune/.env.example` を参考に、
必要であれば `apps/himatsudo/.env` / `apps/fortune/.env` を作成してください
（ローカル開発ではデフォルト値のままで動作します）。

## 開発サーバーの起動（1コマンドで全て起動）

```bash
npm run dev
# もしくは
php bin/serve.php
```

以下の4プロセスがまとめて起動します。

| プロセス | URL |
|---|---|
| Himatsudo アプリ (API + フロントエンド) | http://localhost:8080 |
| HimatsudoFortune アプリ (API + サイト) | http://localhost:8180 |
| apps/himatsudo (管理画面) | http://localhost:5174/himatsudo/ |
| apps/fortune (管理画面) | http://localhost:5175/fortune/ |

Ctrl+C で全プロセスが停止します。

## ビルド

```bash
cd apps/himatsudo && npm run build   # dist/ に出力
cd apps/fortune && npm run build     # dist/ に出力
```

## テスト

```bash
cd apps/himatsudo && npm test
cd apps/fortune && npm test
```

## 本番デプロイ

`deploy/nginx-admin-himatsudo-com.conf` を参照してください。
`admin.himatsudo.com` の `/himatsudo/` と `/fortune/` パス配下に、
それぞれのビルド成果物 (`apps/*/dist/`) を配置する構成のサンプルです。
