import { useEffect, useState } from "react";
import { resolveLocale } from "../lib/locale";
import type { Locale } from "../types";

function getBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return resolveLocale(languages);
}

export function useLocale(forcedLocale?: Locale): Locale {
  const [browserLocale, setBrowserLocale] = useState<Locale>(getBrowserLocale);

  useEffect(() => {
    const handleLanguageChange = () => setBrowserLocale(getBrowserLocale());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  return forcedLocale ?? browserLocale;
}
