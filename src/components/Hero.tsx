import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { QueryCard, SiteContent, VisualStateFixture } from "../types";
import { readVisualTestFixture } from "../hooks/useVisualTest";
import { assetPath } from "../lib/assets";
import styles from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  content: SiteContent["hero"];
  accessibility: SiteContent["accessibility"];
  reducedMotion: boolean;
  visualTest: boolean;
}

interface VerbState {
  current: number;
  previous: number | null;
  sequence: number;
}

type QueryPhase = "idle" | "leaving" | "entering";

const VERB_HOLD_MS = 2400;
const VERB_TRANSITION_MS = 600;
const QUERY_LOOP_MS = 240_000;
const QUERY_SWAP_MS = 320;
const QUERY_ENTER_MS = 1000;

function QueryCardView({ query, phase, duplicate = false }: { query: QueryCard; phase: QueryPhase; duplicate?: boolean }) {
  return (
    <article className={styles.queryCard} data-query-id={query.id} aria-hidden={duplicate || undefined}>
      <div className={`${styles.queryCardInner} ${phase === "leaving" ? styles.queryCardLeaving : ""} ${phase === "entering" ? styles.queryCardEntering : ""}`}>
        <span className={styles.queryNumber}>{query.id}</span>
        <div className={styles.queryBody}>
          <p>{query.text}</p>
        </div>
        <span className={styles.queryCommand}>/query</span>
      </div>
    </article>
  );
}

function mediaTimeIsUsable(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function Hero({ content, accessibility, reducedMotion, visualTest }: HeroProps) {
  const visualFixture: VisualStateFixture = visualTest ? readVisualTestFixture() : { enabled: false };
  const deterministicVerb = visualTest ? (visualFixture.verbIndex ?? 0) % content.verbs.length : 0;
  const deterministicQuery = visualTest ? (visualFixture.taskIndex ?? 0) % content.queries.length : 0;
  const [verbState, setVerbState] = useState<VerbState>({ current: deterministicVerb, previous: null, sequence: 0 });
  const [queryStart, setQueryStart] = useState(deterministicQuery);
  const [queryPhase, setQueryPhase] = useState<QueryPhase>("idle");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mediaAvailable, setMediaAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [chromeDark, setChromeDark] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const verbTimeoutRef = useRef<number | null>(null);
  const querySwapRef = useRef<number | null>(null);
  const queryEnterRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visualTest) return;
    setVerbState({ current: deterministicVerb, previous: null, sequence: 0 });
    setQueryStart(deterministicQuery);
    setQueryPhase("idle");
  }, [deterministicQuery, deterministicVerb, visualTest]);

  const clearVerbTimeout = useCallback(() => {
    if (verbTimeoutRef.current !== null) {
      window.clearTimeout(verbTimeoutRef.current);
      verbTimeoutRef.current = null;
    }
  }, []);

  const advanceVerb = useCallback(() => {
    clearVerbTimeout();
    setVerbState((state) => ({
      current: (state.current + 1) % content.verbs.length,
      previous: state.current,
      sequence: state.sequence + 1,
    }));
    verbTimeoutRef.current = window.setTimeout(() => {
      setVerbState((state) => ({ ...state, previous: null }));
      verbTimeoutRef.current = null;
    }, VERB_TRANSITION_MS);
  }, [clearVerbTimeout, content.verbs.length]);

  const clearQueryTimeouts = useCallback(() => {
    if (querySwapRef.current !== null) window.clearTimeout(querySwapRef.current);
    if (queryEnterRef.current !== null) window.clearTimeout(queryEnterRef.current);
    querySwapRef.current = null;
    queryEnterRef.current = null;
  }, []);

  const advanceQueries = useCallback(() => {
    if (visualTest || reducedMotion) return;
    clearQueryTimeouts();
    setQueryPhase("leaving");
    querySwapRef.current = window.setTimeout(() => {
      setQueryStart((index) => (index + 1) % content.queries.length);
      setQueryPhase("entering");
      queryEnterRef.current = window.setTimeout(() => {
        setQueryPhase("idle");
        queryEnterRef.current = null;
      }, QUERY_ENTER_MS);
      querySwapRef.current = null;
    }, QUERY_SWAP_MS);
  }, [clearQueryTimeouts, content.queries.length, reducedMotion, visualTest]);

  const pauseAudio = useCallback(() => {
    audioRef.current?.pause();
    setSoundEnabled(false);
  }, []);

  const syncAudioTime = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !mediaTimeIsUsable(video.currentTime)) return;
    const targetTime = mediaTimeIsUsable(audio.duration) && audio.duration > 0
      ? video.currentTime % audio.duration
      : video.currentTime;
    if (Math.abs(audio.currentTime - targetTime) > 0.35) {
      try {
        audio.currentTime = targetTime;
      } catch {
        // Metadata can still be unavailable on the first user-triggered play.
      }
    }
  }, []);

  const handleVideoError = useCallback(() => {
    videoRef.current?.pause();
    audioRef.current?.pause();
    setMediaAvailable(false);
    setAudioAvailable(false);
    setSoundEnabled(false);
  }, []);

  const handleAudioError = useCallback(() => {
    audioRef.current?.pause();
    setAudioAvailable(false);
    setSoundEnabled(false);
  }, []);

  useEffect(() => {
    if (reducedMotion || visualTest) return;
    const timer = window.setInterval(advanceVerb, VERB_HOLD_MS);
    return () => window.clearInterval(timer);
  }, [advanceVerb, reducedMotion, visualTest]);

  useEffect(() => {
    if (reducedMotion || visualTest) return;
    const stepMs = QUERY_LOOP_MS / content.queries.length;
    const timer = window.setInterval(advanceQueries, stepMs);
    return () => window.clearInterval(timer);
  }, [advanceQueries, content.queries.length, reducedMotion, visualTest]);

  useEffect(() => () => {
    clearVerbTimeout();
    clearQueryTimeouts();
    audioRef.current?.pause();
  }, [clearQueryTimeouts, clearVerbTimeout]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (reducedMotion || visualTest) {
      video.pause();
      return;
    }
    void video.play().catch(() => undefined);
  }, [mediaAvailable, reducedMotion, visualTest]);

  useEffect(() => {
    if (!reducedMotion && !visualTest) return;
    videoRef.current?.pause();
    pauseAudio();
  }, [pauseAudio, reducedMotion, visualTest]);

  useEffect(() => {
    const handleVisibility = () => {
      const video = videoRef.current;
      const audio = audioRef.current;
      if (document.visibilityState === "hidden") {
        video?.pause();
        audio?.pause();
        return;
      }

      if (!reducedMotion && !visualTest && mediaAvailable) void video?.play().catch(() => undefined);
      if (soundEnabled && audioAvailable && mediaAvailable) {
        syncAudioTime();
        void audio?.play().catch(handleAudioError);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [audioAvailable, handleAudioError, mediaAvailable, reducedMotion, soundEnabled, syncAudioTime, visualTest]);

  useEffect(() => {
    let triggers: ScrollTrigger[] = [];
    const frame = requestAnimationFrame(() => {
      triggers = gsap.utils.toArray<HTMLElement>("[data-header-theme='dark']").map((section, index) =>
        ScrollTrigger.create({
          id: `hero-chrome-theme-${index}`,
          trigger: section,
          start: "top bottom",
          end: "bottom bottom",
          onToggle: ({ isActive }) => setChromeDark(isActive),
        }),
      );
    });
    return () => {
      cancelAnimationFrame(frame);
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio || !audioAvailable || !mediaAvailable) return;
    if (soundEnabled) {
      pauseAudio();
      return;
    }

    syncAudioTime();
    try {
      const playback = audio.play();
      setSoundEnabled(true);
      void playback?.catch(handleAudioError);
    } catch {
      handleAudioError();
    }
  };

  const handleVideoMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (visualTest) {
      const requestedTime = visualFixture.mediaTime ?? 2.4;
      const frozenTime = mediaTimeIsUsable(video.duration)
        ? Math.min(requestedTime, Math.max(0, video.duration - 0.05))
        : 0;
      video.currentTime = frozenTime;
      video.pause();
    }
  };

  const desktopQueries = Array.from({ length: Math.min(3, content.queries.length) }, (_, offset) =>
    content.queries[(queryStart + offset) % content.queries.length],
  );
  const mobileQueries = [...content.queries, ...content.queries];
  const heroClassName = `${styles.hero} ${visualTest ? styles.deterministic : ""}`;
  const buildingText = content.building.replace(/(?:\.{3}|…)$/, "");

  return (
    <section className={heroClassName} aria-labelledby="hero-title" data-deterministic={visualTest}>
      <img
        className={styles.poster}
        src={assetPath("assets/images/computer-hero-bg-fallback-2.webp")}
        srcSet={`${assetPath("assets/images/responsive/computer-hero-bg-fallback-2-w900.webp")} 900w, ${assetPath("assets/images/responsive/computer-hero-bg-fallback-2-w1200.webp")} 1200w, ${assetPath("assets/images/computer-hero-bg-fallback-2.webp")} 1600w, ${assetPath("assets/images/responsive/computer-hero-bg-fallback-2-w2400.webp")} 2400w`}
        sizes="100vw"
        alt=""
        fetchPriority="high"
      />
      {mediaAvailable && !reducedMotion && (
        <video
          ref={videoRef}
          className={styles.backgroundVideo}
          src={assetPath("assets/video/computer-hero-bg-2.webm")}
          poster={assetPath("assets/images/computer-hero-bg-fallback-2.webp")}
          autoPlay={!visualTest}
          muted
          loop
          playsInline
          preload="auto"
          onLoadedMetadata={handleVideoMetadata}
          onTimeUpdate={soundEnabled ? syncAudioTime : undefined}
          onSeeked={soundEnabled ? syncAudioTime : undefined}
          onError={handleVideoError}
        />
      )}
      {!reducedMotion && (
        <audio
          ref={audioRef}
          src={assetPath("assets/audio/pplx-computer.mp3")}
          loop
          preload="none"
          onError={handleAudioError}
        />
      )}
      <div className={styles.edgeMask} aria-hidden="true" />

      <div className={styles.headlineWrap}>
        <h1 id="hero-title" className={styles.product}>
          {content.product}
        </h1>
        <div className={styles.verbViewport} aria-hidden="true" data-verb-sequence={verbState.sequence}>
          {verbState.previous !== null && (
            <span className={`${styles.verb} ${styles.verbPrevious}`} data-verb-slot="previous">
              {content.verbs[verbState.previous]}
            </span>
          )}
          <span
            key={`${verbState.current}-${verbState.sequence}`}
            className={`${styles.verb} ${verbState.previous === null ? styles.verbActive : styles.verbCurrent}`}
            data-verb-slot="current"
          >
            {content.verbs[verbState.current]}
          </span>
        </div>
        <span className="sr-only">{`${content.product} ${content.verbs[0]}`}</span>
        <a className={styles.cta} href="https://www.perplexity.ai/computer">
          {content.cta}
        </a>
      </div>

      <div className={styles.queryViewport} aria-hidden="true">
        <div className={styles.queryDesktopStack} data-testid="desktop-query-stack" data-query-phase={queryPhase}>
          {desktopQueries.map((query) => <QueryCardView query={query} phase={queryPhase} key={query.id} />)}
        </div>
        <div className={styles.queryMobileTrack} data-testid="mobile-query-track">
          {mobileQueries.map((query, index) => (
            <QueryCardView query={query} phase="idle" duplicate={index >= content.queries.length} key={`${query.id}-${index}`} />
          ))}
        </div>
      </div>
      <ol className="sr-only">
        {content.queries.map((query) => <li key={`accessible-${query.id}`}>{query.text}</li>)}
      </ol>

      <div className={`${styles.status} ${chromeDark ? styles.chromeDark : ""}`}>
        <button type="button" className={styles.statusIndicator} aria-label={content.building} onClick={advanceQueries}>
          <span className={styles.statusLabel}>
            {buildingText}
            <span className={styles.statusDots} aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
          </span>
          <span className={`${styles.statusBits} ${queryPhase !== "idle" ? styles.statusBitsActive : ""}`} aria-hidden="true">
            ▮▮▯▮▯▮▮▯▯▮▮▯▮▯▯▮▮▯▮▯▮▮▯▯▮▯▮▮▯▮
          </span>
        </button>
      </div>

      {audioAvailable && mediaAvailable && !reducedMotion && (
        <div className={`${styles.audio} ${chromeDark ? styles.chromeDark : ""}`}>
          <button
            className={styles.audioIndicator}
            type="button"
            aria-label={soundEnabled ? accessibility.soundOff : accessibility.soundOn}
            aria-pressed={soundEnabled}
            onClick={toggleSound}
          >
            <span className={`${styles.audioWave} ${soundEnabled ? styles.audioWaveActive : ""}`} aria-hidden="true">▂▅▃▇▆▂▅▃</span>
            <span className={styles.audioToggle} aria-hidden="true">
              <span className={soundEnabled ? styles.audioTextActive : styles.audioTextMuted}>{content.soundOn}</span>
              <span className={styles.audioSeparator}> / </span>
              <span className={soundEnabled ? styles.audioTextMuted : styles.audioTextActive}>{content.soundOff}</span>
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
