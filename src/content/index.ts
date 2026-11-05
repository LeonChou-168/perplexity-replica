import { enContent } from "./en";
import { zhContent } from "./zh-CN";
import type { Locale, SiteContent } from "../types";

export const contentByLocale: Record<Locale, SiteContent> = {
  en: enContent,
  "zh-CN": zhContent,
};
