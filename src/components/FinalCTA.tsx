import type { SiteContent } from "../types";
import { assetPath, responsiveImageSrcSet } from "../lib/assets";
import styles from "./FinalCTA.module.css";

interface FinalCTAProps {
  content: SiteContent["finalCta"];
}

export function FinalCTA({ content }: FinalCTAProps) {
  const marker = "Computer";
  const markerIndex = content.title.indexOf(marker);
  const firstLine = markerIndex >= 0 ? content.title.slice(0, markerIndex + marker.length) : content.title;
  const secondLine = markerIndex >= 0 ? content.title.slice(markerIndex + marker.length).trimStart() : "";

  return (
    <section className={styles.section} data-header-theme="dark" aria-labelledby="final-cta-title">
      <img
        className={styles.background}
        src={assetPath("assets/images/footer-background.webp")}
        srcSet={responsiveImageSrcSet("assets/images/footer-background.webp")}
        sizes="100vw"
        alt=""
        loading="lazy"
      />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.copy}>
        <h2 id="final-cta-title">
          {firstLine}
          {secondLine && <><br />{secondLine}</>}
        </h2>
        <p>{content.description}</p>
        <a href="https://www.perplexity.ai/computer">{content.cta}</a>
      </div>
    </section>
  );
}
