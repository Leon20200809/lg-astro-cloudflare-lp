## LPを効率よく作って公開する構成

このプロジェクトでは、LPを小さく・速く・低コストで公開するために以下の構成を採用する。

### 構成

- **Astro**
  - LP本体を静的HTMLとして生成
  - 表示が軽く、WordPressやDBが不要

- **Cloudflare Workers + Static Assets**
  - Astroの生成物を公開
  - `/api/*` だけWorkerでバックエンド処理
  - GitHubへのpushから自動デプロイ可能

- **Resend**
  - 問い合わせフォームのメール送信を担当
  - WorkerからResend APIを呼び出す
  - APIキーはCloudflare Runtime Secretで管理

- **Cloudflare Custom Domain**
  - `partner.lazygenius.dev` のような独自URLをWorkerへ接続
  - DNS・HTTPS証明書・ルーティングをCloudflare側で管理

### 全体の流れ

```text
Astro
↓
静的LPを生成
↓
Cloudflareへデプロイ
↓
Custom Domainで公開
↓
問い合わせ
↓
/api/contact
↓
Cloudflare Worker
↓
Resend API
↓
メール受信
```
