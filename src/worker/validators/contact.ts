import type { ContactData } from "../types/contact";

const isEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isUrl = (value: string): boolean => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateContact = (data: ContactData): string | null => {
  if (!data.name) {
    return "お名前を入力してください。";
  }

  if (!data.email) {
    return "メールアドレスを入力してください。";
  }

  if (!isEmail(data.email)) {
    return "メールアドレスの形式を確認してください。";
  }

  if (!data.message) {
    return "ご相談内容を入力してください。";
  }

  if (!isUrl(data.siteUrl)) {
    return "ホームページURLの形式を確認してください。";
  }

  if (data.company.length > 100) {
    return "会社名が長すぎます。";
  }

  if (data.name.length > 100) {
    return "お名前が長すぎます。";
  }

  if (data.email.length > 254) {
    return "メールアドレスが長すぎます。";
  }

  if (data.siteUrl.length > 500) {
    return "ホームページURLが長すぎます。";
  }

  if (data.message.length > 3000) {
    return "ご相談内容が長すぎます。";
  }

  return null;
};
