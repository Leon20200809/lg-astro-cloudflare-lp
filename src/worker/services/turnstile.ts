import type { Env } from "../types/env";

const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

// TurnstileトークンをCloudflareへ送り、検証結果を返す
export const verifyTurnstile = async (
  token: string,
  remoteIp: string,
  env: Env,
): Promise<boolean> => {
  if (!env.TURNSTILE_SECRET_KEY) {
    throw new Error("TURNSTILE_SECRET_KEY is not configured");
  }

  if (!token || token.length > 2048) {
    return false;
  }

  const body = new FormData();

  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error(`Turnstile Siteverify failed: ${response.status}`);
  }

  const result = (await response.json()) as TurnstileResponse;

  if (!result.success) {
    console.warn("Turnstile validation rejected:", result["error-codes"] ?? []);
  }

  return result.success;
};
