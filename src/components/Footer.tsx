import type { SiteContent } from "../types";
import { assetPath } from "../lib/assets";
import { BrandMark } from "./BrandLogo";
import styles from "./Footer.module.css";

interface FooterProps {
  content: SiteContent["footer"];
  homeLabel: string;
}

export function Footer({ content, homeLabel }: FooterProps) {
  return (
    <footer className={styles.footer} data-header-theme="dark">
      <div className={styles.inner}>
        <div className={styles.top}>
          <nav className={styles.siteMap} aria-label="Footer navigation" lang="en">
            {content.groups.map((group) => (
              <section className={styles.group} key={group.id}>
                <h3>{group.heading}</h3>
                {group.subheading && <h4>{group.subheading}</h4>}
                <ul>
                  {group.links.map((link) => (
                    <li key={`${group.id}-${link.id}`}><a href={link.href}>{link.label}</a></li>
                  ))}
                </ul>
                {group.sections?.map((section) => (
                  <div className={styles.subsection} key={`${group.id}-${section.heading}`}>
                    <h4>{section.heading}</h4>
                    <ul>
                      {section.links.map((link) => (
                        <li key={`${group.id}-${section.heading}-${link.id}`}><a href={link.href}>{link.label}</a></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </nav>

          <div className={styles.badges}>
            <a href="https://apps.apple.com/us/app/perplexity-ask-anything/id1668000334" aria-label="Download on the App Store" lang="en">
              <img src={assetPath("assets/icons/apple-app-store.svg")} alt="" />
            </a>
            <a href="https://play.google.com/store/apps/details?id=ai.perplexity.app.android" aria-label="Get it on Google Play" lang="en">
              <img src={assetPath("assets/icons/google-app-store.svg")} alt="" />
            </a>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.bottom}>
          <a className={styles.logo} href="https://www.perplexity.ai/" aria-label={homeLabel}>
            <BrandMark />
          </a>
          <p className={styles.copyright}>{content.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
