import type { Locale } from "../types";

export function resolveLocale(languages: readonly string[]): Locale {
  const supported = languages.find((language) => /^(zh|en)(-|$)/i.test(language));
  return supported?.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}
