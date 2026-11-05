import { useState } from "react";
import { Cookie } from "lucide-react";
import type { SiteContent } from "../types";
import styles from "./CookieBanner.module.css";

const STORAGE_KEY = "pplx-computer-replica-cookie-choice-v2";

interface CookieBannerProps {
  content: SiteContent["cookie"];
}

function hasStoredChoice(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function CookieBanner({ content }: CookieBannerProps) {
  const [visible, setVisible] = useState(() => !hasStoredChoice());

  const dismiss = (choice: "accepted" | "rejected") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // The visual dismissal still works when storage is unavailable.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className={styles.banner} role="dialog" aria-label={content.title} data-testid="cookie-banner">
      <h2>
        <Cookie size={17} strokeWidth={1.6} aria-hidden="true" />
        {content.title}
      </h2>
      <p>{content.body}</p>
      <div className={styles.actions}>
        <button type="button" onClick={() => dismiss("rejected")}>
          {content.reject}
        </button>
        <button className={styles.accept} type="button" onClick={() => dismiss("accepted")}>
          {content.accept}
        </button>
      </div>
    </aside>
  );
}
