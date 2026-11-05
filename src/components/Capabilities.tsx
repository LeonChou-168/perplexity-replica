import { useEffect, useRef } from "react";
import type { SiteContent } from "../types";
import { assetPath, responsiveImageSrcSet } from "../lib/assets";
import styles from "./Capabilities.module.css";

interface CapabilitiesProps {
  content: SiteContent["capabilities"];
}

export function Capabilities({ content }: CapabilitiesProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-feature-row]") ?? []);
    if (!("IntersectionObserver" in window)) {
      rows.forEach((row) => { row.dataset.revealed = "true"; });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10%", threshold: 0.12 },
    );

    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [content.items]);

  return (
    <section className={styles.section} aria-labelledby="capabilities-title">
      <div className={styles.inner}>
        <header className={styles.heading}>
          <span>{content.eyebrow}</span>
          <h2 id="capabilities-title">{content.title}</h2>
        </header>

        <div ref={listRef} className={styles.list}>
          {content.items.map((item) => (
            <article className={styles.item} key={item.id} data-feature-row data-revealed="false">
              <div className={styles.textColumn}>
                <span className={styles.number}>{item.number}</span>
                <div className={styles.copy}>
                  <h3>{item.title}</h3>
                  <div className={styles.description}>
                    {item.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                </div>
              </div>

              <a className={styles.mediaLink} href={item.href} aria-label={`${item.cta}: ${item.title}`}>
                <img
                  src={assetPath(item.image)}
                  srcSet={responsiveImageSrcSet(item.image)}
                  sizes="(max-width: 800px) 100vw, 50vw"
                  alt={item.alt}
                  loading="lazy"
                  width="1600"
                  height="900"
                />
                <span>{item.cta}</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
