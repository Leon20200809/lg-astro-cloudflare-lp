import type { Env } from "./types/env";
import { handleContact } from "./routes/contact";
import { jsonResponse } from "./utils/response";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // リクエストURLを解析する
    const url = new URL(request.url);

    // お問い合わせAPIのPOSTを担当ルートへ渡す
    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env);
    }

    // 存在しないAPIには404を返す
    if (url.pathname.startsWith("/api/")) {
      return jsonResponse(
        {
          message: "APIが見つかりません。",
        },
        404,
      );
    }

    // Workerの担当外リクエストには404を返す
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
};
