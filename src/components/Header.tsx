import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import type { LinkItem, SiteContent } from "../types";
import { BrandLogo } from "./BrandLogo";
import styles from "./Header.module.css";

gsap.registerPlugin(ScrollTrigger);

interface HeaderProps {
  content: SiteContent;
}

type DropdownId = "products" | "resources" | null;

const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

function DropdownLinks({ links, mobile = false }: { links: LinkItem[]; mobile?: boolean }) {
  return (
    <ul className={styles.dropdownGrid} data-mobile-links={mobile ? "true" : undefined}>
      {links.map((link) => (
        <li key={link.id}>
          <a className={styles.dropdownLink} href={link.href}>
            <span>{link.label}</span>
            {!mobile && <span aria-hidden="true">↗</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Header({ content }: HeaderProps) {
  const [entered, setEntered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [dropdown, setDropdown] = useState<DropdownId>(null);
  const [dark, setDark] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lastScrollYRef = useRef(0);

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
    setMobileProductsOpen(false);
    setMobileResourcesOpen(false);
  }, []);

  const closeDropdown = useCallback((restoreFocus = false) => {
    setDropdown(null);
    if (restoreFocus) dropdownTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    let frame = 0;

    const updateHeader = () => {
      frame = 0;
      const nextScrollY = Math.max(0, window.scrollY);
      const delta = nextScrollY - lastScrollYRef.current;
      setScrolled(nextScrollY > 8);

      if (mobileOpen || dropdown !== null || nextScrollY <= 64) {
        setHidden(false);
      } else if (delta > 4) {
        setHidden(true);
      } else if (delta < -4) {
        setHidden(false);
      }

      lastScrollYRef.current = nextScrollY;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateHeader);
    };

    updateHeader();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [dropdown, mobileOpen]);

  useEffect(() => {
    let triggers: ScrollTrigger[] = [];
    const frame = requestAnimationFrame(() => {
      triggers = gsap.utils.toArray<HTMLElement>("[data-header-theme='dark']").map((section, index) =>
        ScrollTrigger.create({
          id: `header-theme-${index}`,
          trigger: section,
          start: "top 64px",
          end: "bottom 64px",
          onToggle: ({ isActive }) => setDark(isActive),
        }),
      );
    });
    return () => {
      cancelAnimationFrame(frame);
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const inertTargets = Array.from(document.querySelectorAll<HTMLElement>("main, footer, [data-testid='cookie-banner']"));
    const inertState = inertTargets.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    document.body.style.overflow = "hidden";
    inertTargets.forEach((element) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    const focusFrame = requestAnimationFrame(() => {
      mobileNavRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenu();
        return;
      }

      if (event.key !== "Tab") return;
      const menuItems = Array.from(mobileNavRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
      const focusable = [mobileToggleRef.current, ...menuItems].filter((element): element is HTMLElement => Boolean(element));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      inertState.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      window.removeEventListener("keydown", handleKeyDown);
      requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
  }, [closeMobileMenu, mobileOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dropdown !== null) {
        event.preventDefault();
        closeDropdown(true);
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) closeDropdown();
    };
    const closeAtDesktop = () => {
      if (window.innerWidth > 960 && mobileOpen) closeMobileMenu();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", closeOutside);
    window.addEventListener("resize", closeAtDesktop);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("resize", closeAtDesktop);
    };
  }, [closeDropdown, closeMobileMenu, dropdown, mobileOpen]);

  const toggleDropdown = (id: Exclude<DropdownId, null>, trigger: HTMLButtonElement) => {
    dropdownTriggerRef.current = trigger;
    setHidden(false);
    setDropdown((current) => (current === id ? null : id));
  };

  const headerClassName = [
    styles.header,
    entered ? styles.entered : "",
    hidden && !mobileOpen ? styles.hidden : "",
    scrolled ? styles.scrolled : "",
    dark && !mobileOpen ? styles.dark : "",
    mobileOpen ? styles.menuOpen : "",
  ].filter(Boolean).join(" ");
  const primaryNavigationLabel = content.locale === "zh-CN" ? "主导航" : "Primary navigation";
  const mobileNavigationLabel = content.locale === "zh-CN" ? "移动导航" : "Mobile navigation";

  return (
    <header
      ref={headerRef}
      className={headerClassName}
      data-entered={entered}
      data-hidden={hidden && !mobileOpen}
      data-scrolled={scrolled}
      data-theme={dark && !mobileOpen ? "dark" : "light"}
      data-menu-open={mobileOpen}
    >
      <div className={styles.bar}>
        <a className={styles.logo} href="https://www.perplexity.ai/hub" aria-label={content.accessibility.home}>
          <BrandLogo />
        </a>

        <div className={styles.navRight}>
          <nav className={styles.desktopNav} aria-label={primaryNavigationLabel}>
            <div className={styles.navItem} onMouseEnter={() => setDropdown("products")} onMouseLeave={() => closeDropdown()}>
              <button
                type="button"
                aria-expanded={dropdown === "products"}
                aria-controls="products-menu"
                onClick={(event) => toggleDropdown("products", event.currentTarget)}
              >
                {content.header.products}
                <ChevronDown className={dropdown === "products" ? styles.rotated : ""} size={14} strokeWidth={1.6} />
              </button>
              {dropdown === "products" && (
                <div id="products-menu" className={styles.dropdown}>
                  <DropdownLinks links={content.header.productLinks} />
                </div>
              )}
            </div>
            <a href="https://www.perplexity.ai/enterprise">{content.header.enterprise}</a>
            <a href="https://www.perplexity.ai/hub/pricing">{content.header.pricing}</a>
            <div className={styles.navItem} onMouseEnter={() => setDropdown("resources")} onMouseLeave={() => closeDropdown()}>
              <button
                type="button"
                aria-expanded={dropdown === "resources"}
                aria-controls="resources-menu"
                onClick={(event) => toggleDropdown("resources", event.currentTarget)}
              >
                {content.header.resources}
                <ChevronDown className={dropdown === "resources" ? styles.rotated : ""} size={14} strokeWidth={1.6} />
              </button>
              {dropdown === "resources" && (
                <div id="resources-menu" className={styles.dropdown}>
                  <DropdownLinks links={content.header.resourceLinks} />
                </div>
              )}
            </div>
          </nav>

          <a className={styles.primaryCta} href="https://www.perplexity.ai/computer">
            {content.header.cta}
          </a>

          <button
            ref={mobileToggleRef}
            className={styles.mobileToggle}
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? content.accessibility.closeMenu : content.accessibility.openMenu}
            data-menu-control
            onClick={() => {
              if (mobileOpen) closeMobileMenu();
              else {
                setHidden(false);
                setDropdown(null);
                setMobileOpen(true);
              }
            }}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-navigation" ref={mobileNavRef} className={styles.mobileNav} aria-label={mobileNavigationLabel} data-mobile-menu-panel>
          <div className={styles.mobileSection} style={{ "--item-index": 0 } as CSSProperties}>
            <button type="button" aria-expanded={mobileProductsOpen} onClick={() => setMobileProductsOpen((open) => !open)}>
              {content.header.products}
              <ChevronDown className={mobileProductsOpen ? styles.rotated : ""} size={16} />
            </button>
            {mobileProductsOpen && <DropdownLinks links={content.header.productLinks} mobile />}
          </div>
          <a style={{ "--item-index": 1 } as CSSProperties} href="https://www.perplexity.ai/enterprise">{content.header.enterprise}</a>
          <a style={{ "--item-index": 2 } as CSSProperties} href="https://www.perplexity.ai/hub/pricing">{content.header.pricing}</a>
          <div className={styles.mobileSection} style={{ "--item-index": 3 } as CSSProperties}>
            <button type="button" aria-expanded={mobileResourcesOpen} onClick={() => setMobileResourcesOpen((open) => !open)}>
              {content.header.resources}
              <ChevronDown className={mobileResourcesOpen ? styles.rotated : ""} size={16} />
            </button>
            {mobileResourcesOpen && <DropdownLinks links={content.header.resourceLinks} mobile />}
          </div>
          <a className={styles.mobileCta} style={{ "--item-index": 4 } as CSSProperties} href="https://www.perplexity.ai/computer">
            {content.header.cta}
          </a>
        </nav>
      )}
    </header>
  );
}
