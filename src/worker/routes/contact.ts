import type { ContactData } from "../types/contact";
import type { Env } from "../types/env";
import { sendContactMail } from "../services/resend";
import { verifyTurnstile } from "../services/turnstile";
import { jsonResponse } from "../utils/response";
import { validateContact } from "../validators/contact";

const getField = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const createContactData = (formData: FormData): ContactData => {
  return {
    company: getField(formData, "company"),
    name: getField(formData, "name"),
    email: getField(formData, "email"),
    siteUrl: getField(formData, "siteUrl"),
    message: getField(formData, "message"),
    gotcha: getField(formData, "_gotcha"),
  };
};

export const handleContact = async (
  request: Request,
  env: Env,
): Promise<Response> => {
  let formData: FormData;

  // フォームデータを取得する
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse(
      {
        message: "送信内容を読み取れませんでした。",
      },
      400,
    );
  }

  // フォームデータを問い合わせ用の型へ整形する
  const data = createContactData(formData);

  // Honeypotに入力されたBotはメールを送らず成功扱いにする
  if (data.gotcha) {
    return jsonResponse(
      {
        message: "お問い合わせを受け付けました。",
      },
      200,
    );
  }

  // 問い合わせ内容を検証する
  const validationError = validateContact(data);

  if (validationError) {
    return jsonResponse(
      {
        message: validationError,
      },
      400,
    );
  }

  // Turnstileトークンを検証し、失敗時はメール送信へ進めない
  try {
    const turnstileToken = getField(formData, "cf-turnstile-response");
    const remoteIp = request.headers.get("CF-Connecting-IP") ?? "";
    const isHuman = await verifyTurnstile(turnstileToken, remoteIp, env);

    if (!isHuman) {
      return jsonResponse(
        {
          message: "セキュリティ確認に失敗しました。もう一度お試しください。",
        },
        400,
      );
    }
  } catch (error) {
    console.error("Turnstile verification failed:", error);

    return jsonResponse(
      {
        message: "セキュリティ確認を完了できませんでした。時間をおいて再度お試しください。",
      },
      503,
    );
  }

  // 問い合わせ通知メールを送信する
  try {
    await sendContactMail(data, env);
  } catch (error) {
    console.error("Contact mail failed:", error);

    return jsonResponse(
      {
        message: "送信に失敗しました。時間をおいて再度お試しください。",
      },
      500,
    );
  }

  // 正常終了を返す
  return jsonResponse(
    {
      message: "お問い合わせを受け付けました。ありがとうございます。",
    },
    200,
  );
};
