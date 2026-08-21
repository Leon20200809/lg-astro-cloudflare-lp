import type { ContactData } from "../types/contact";
import type { Env } from "../types/env";

export const sendContactMail = async (
  data: ContactData,
  env: Env,
): Promise<void> => {
  const company = data.company || "未入力";
  const siteUrl = data.siteUrl || "未入力";

  const subject = `【Web相談】${company} / ${data.name} 様`;

  const text = `
ホームページからお問い合わせがありました。

■ 会社名
${company}

■ お名前
${data.name}

■ メールアドレス
${data.email}

■ ホームページURL
${siteUrl}

■ ご相談内容
${data.message}
`.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",

    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,

      "Content-Type": "application/json",

      "User-Agent": "lg-astro-cloudflare-lp/1.0",
    },

    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],

      reply_to: data.email,

      subject,
      text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    console.error("Resend API error:", response.status, errorBody);

    throw new Error("Resend email send failed");
  }
};
