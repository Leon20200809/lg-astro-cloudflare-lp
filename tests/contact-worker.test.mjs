import assert from "node:assert/strict";
import test from "node:test";

import worker from "../.test-dist/index.js";

const env = {
  RESEND_API_KEY: "test-resend-key",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
  CONTACT_TO: "contact@example.com",
  CONTACT_FROM: "contact@example.com",
};

// 有効な問い合わせリクエストを組み立てる
const createRequest = (turnstileToken = "test-token") => {
  const body = new FormData();

  body.set("company", "テスト株式会社");
  body.set("name", "テスト太郎");
  body.set("email", "test@example.com");
  body.set("siteUrl", "https://example.com");
  body.set("message", "問い合わせテストです。");
  body.set("cf-turnstile-response", turnstileToken);

  return new Request("https://example.com/api/contact", {
    method: "POST",
    body,
    headers: { "CF-Connecting-IP": "203.0.113.1" },
  });
};

// 外部APIの応答を差し替え、呼び出されたURLを記録する
const mockExternalApis = (turnstileSuccess) => {
  const urls = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;

    urls.push(url);

    if (url.includes("/turnstile/v0/siteverify")) {
      return Response.json({
        success: turnstileSuccess,
        "error-codes": turnstileSuccess ? [] : ["invalid-input-response"],
      });
    }

    if (url === "https://api.resend.com/emails") {
      return Response.json({ id: "test-email-id" });
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  return {
    urls,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
};

test("Turnstile検証成功時だけ問い合わせメールを送信する", async () => {
  const mock = mockExternalApis(true);

  try {
    const response = await worker.fetch(createRequest(), env);

    assert.equal(response.status, 200);
    assert.deepEqual(mock.urls, [
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      "https://api.resend.com/emails",
    ]);
  } finally {
    mock.restore();
  }
});

test("Turnstile検証失敗時は問い合わせメールを送信しない", async () => {
  const mock = mockExternalApis(false);

  try {
    const response = await worker.fetch(createRequest(), env);
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.match(result.message, /セキュリティ確認に失敗/);
    assert.deepEqual(mock.urls, [
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    ]);
  } finally {
    mock.restore();
  }
});

test("Honeypot検知時は外部APIを呼ばず既存どおり成功扱いにする", async () => {
  const mock = mockExternalApis(true);
  const request = createRequest("");
  const body = await request.formData();

  body.set("_gotcha", "bot-value");

  try {
    const response = await worker.fetch(
      new Request(request.url, { method: "POST", body }),
      env,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(mock.urls, []);
  } finally {
    mock.restore();
  }
});
