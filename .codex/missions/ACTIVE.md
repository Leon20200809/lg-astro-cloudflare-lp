# ACTIVE.md

## 任務

問い合わせフォームへCloudflare Turnstileを導入する。フロント表示だけでなくWorker側でトークンを検証し、検証成功時のみ既存の問い合わせ処理へ進める。既存Honeypot・validation・Resend処理は維持する。秘密鍵はSecret管理し、build・送信成功・Turnstile失敗時の拒否まで確認する。
