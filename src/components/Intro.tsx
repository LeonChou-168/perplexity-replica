import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { SiteContent } from "../types";
import { useReducedMotion } from "../hooks/useReducedMotion";
import styles from "./Intro.module.css";

interface IntroProps {
  content: SiteContent["intro"];
}

interface Stamp {
  id: number;
  left: string;
  top: string;
  rotate: string;
}

const STAMP_POSITIONS = [
  { left: "19%", top: "24%", rotate: "-7deg" },
  { left: "78%", top: "31%", rotate: "5deg" },
  { left: "27%", top: "74%", rotate: "4deg" },
  { left: "73%", top: "69%", rotate: "-5deg" },
] as const;

export function Intro({ content }: IntroProps) {
  const reducedMotion = useReducedMotion();
  const [effectActive, setEffectActive] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const wordmarkRef = useRef<HTMLButtonElement>(null);
  const stampIdRef = useRef(0);
  const restartFrameRef = useRef<number | null>(null);
  const effectTimerRef = useRef<number | null>(null);
  const stampTimersRef = useRef<Set<number>>(new Set());
  const lead = content.lead.replace(/^Perplexity Computer\s*/, "");

  useEffect(() => () => {
    if (restartFrameRef.current !== null) cancelAnimationFrame(restartFrameRef.current);
    if (effectTimerRef.current !== null) window.clearTimeout(effectTimerRef.current);
    stampTimersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    setEffectActive(false);
    setStamps([]);
    wordmarkRef.current?.style.setProperty("--eye-x", "0px");
    wordmarkRef.current?.style.setProperty("--eye-y", "0px");
  }, [reducedMotion]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
    const y = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)));
    event.currentTarget.style.setProperty("--eye-x", `${(x * 1.4).toFixed(2)}px`);
    event.currentTarget.style.setProperty("--eye-y", `${(y * 0.8).toFixed(2)}px`);
  };

  const resetEyes = () => {
    wordmarkRef.current?.style.setProperty("--eye-x", "0px");
    wordmarkRef.current?.style.setProperty("--eye-y", "0px");
  };

  const activateWordmark = () => {
    if (reducedMotion) return;

    if (restartFrameRef.current !== null) cancelAnimationFrame(restartFrameRef.current);
    if (effectTimerRef.current !== null) window.clearTimeout(effectTimerRef.current);
    setEffectActive(false);
    restartFrameRef.current = requestAnimationFrame(() => {
      setEffectActive(true);
      restartFrameRef.current = null;
    });
    effectTimerRef.current = window.setTimeout(() => {
      setEffectActive(false);
      effectTimerRef.current = null;
    }, 1200);

    const id = stampIdRef.current;
    stampIdRef.current += 1;
    const position = STAMP_POSITIONS[id % STAMP_POSITIONS.length];
    setStamps((current) => [...current.slice(-2), { id, ...position }]);
    const timer = window.setTimeout(() => {
      setStamps((current) => current.filter((stamp) => stamp.id !== id));
      stampTimersRef.current.delete(timer);
    }, 2600);
    stampTimersRef.current.add(timer);
  };

  return (
    <section className={styles.intro} aria-label={content.lead}>
      <div className={styles.stampLayer} aria-hidden="true">
        {stamps.map((stamp) => (
          <span
            className={styles.stamp}
            data-testid="intro-stamp"
            key={stamp.id}
            style={{ "--stamp-left": stamp.left, "--stamp-top": stamp.top, "--stamp-rotate": stamp.rotate } as CSSProperties}
          >
            {content.running}
          </span>
        ))}
      </div>

      <div className={styles.manifesto}>
        <p className={styles.lead}>
          <span className={styles.wordmarkWrap}>
            <button
              ref={wordmarkRef}
              className={`${styles.productLabel} ${effectActive ? styles.productLabelActive : ""}`}
              type="button"
              aria-describedby={tooltipVisible ? "computer-wordmark-tooltip" : undefined}
              onClick={activateWordmark}
              onFocus={() => setTooltipVisible(true)}
              onBlur={() => setTooltipVisible(false)}
              onPointerEnter={() => setTooltipVisible(true)}
              onPointerLeave={() => {
                setTooltipVisible(false);
                resetEyes();
              }}
              onPointerMove={handlePointerMove}
            >
              <svg className={styles.computerIcon} width="29" height="24" viewBox="0 0 29 24" fill="none" aria-hidden="true">
                <g clipPath="url(#computer-icon-clip)">
                  <path d="M22.41 1.334H6.59c-1.455 0-2.635 1.194-2.635 2.667v10.666c0 1.473 1.18 2.667 2.636 2.667h15.818c1.456 0 2.637-1.194 2.637-2.667V4.001c0-1.473-1.18-2.667-2.637-2.667ZM1.318 22.668h26.364" />
                  <path className={styles.eye} d="M11.8638 7.1119V8.8887" />
                  <path className={styles.eye} d="M17.1362 7.1119V8.8887" />
                </g>
                <defs><clipPath id="computer-icon-clip"><rect width="29" height="24" fill="white" /></clipPath></defs>
              </svg>
              <span>Perplexity Computer</span>
            </button>
            {tooltipVisible && (
              <span id="computer-wordmark-tooltip" className={styles.tooltip} role="tooltip">
                {content.running}
              </span>
            )}
          </span>{" "}
          {lead}
        </p>
        <p>{content.detail}</p>
        <p className={styles.contrast}>
          <span>{content.contrastLead}</span>
          <span>{content.contrastMiddle}</span>
          <strong>{content.contrastEnd}</strong>
        </p>
      </div>
    </section>
  );
}
