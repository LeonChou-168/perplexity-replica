import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Pause, Play, X } from "lucide-react";
import styles from "./ProductVideo.module.css";

export interface ProductVideoLabels {
  play: string;
  pause: string;
  seek: string;
  expand: string;
  close: string;
  dialog: string;
}

interface ProductVideoProps {
  src: string;
  poster: string;
  label: string;
  labels: ProductVideoLabels;
  active: boolean;
  reducedMotion: boolean;
  visualTest: boolean;
  visualTestTime?: number;
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function ProductVideo({
  src,
  poster,
  label,
  labels,
  active,
  reducedMotion,
  visualTest,
  visualTestTime = 1,
}: ProductVideoProps) {
  const dialogId = useId();
  const inlineVideoRef = useRef<HTMLVideoElement>(null);
  const lightboxVideoRef = useRef<HTMLVideoElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [manualPlayback, setManualPlayback] = useState(false);
  const [wantsPlayback, setWantsPlayback] = useState(active && !reducedMotion && !visualTest);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxFailed, setLightboxFailed] = useState(false);

  useEffect(() => {
    setManualPlayback(false);
    setWantsPlayback(active && !reducedMotion && !visualTest && !failed);
  }, [active, failed, reducedMotion, visualTest]);

  useEffect(() => {
    if (!lightboxOpen || !inlineVideoRef.current || !lightboxVideoRef.current) return;
    lightboxVideoRef.current.currentTime = inlineVideoRef.current.currentTime;
    setCurrentTime(inlineVideoRef.current.currentTime);
  }, [lightboxOpen]);

  useEffect(() => {
    const inlineVideo = inlineVideoRef.current;
    const lightboxVideo = lightboxVideoRef.current;
    const targetVideo = lightboxOpen ? lightboxVideo : inlineVideo;
    const inactiveVideo = lightboxOpen ? inlineVideo : lightboxVideo;

    inactiveVideo?.pause();

    const playbackAllowed = !failed && !reducedMotion && !visualTest && (active || manualPlayback);
    if (!targetVideo || !playbackAllowed || !wantsPlayback) {
      targetVideo?.pause();
      if (!wantsPlayback) setPlaying(false);
      return;
    }

    void targetVideo.play().catch(() => {
      setWantsPlayback(false);
      setPlaying(false);
    });
  }, [active, failed, lightboxOpen, manualPlayback, reducedMotion, visualTest, wantsPlayback]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const trigger = expandButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        const lightboxVideo = lightboxVideoRef.current;
        if (lightboxVideo && inlineVideoRef.current) {
          inlineVideoRef.current.currentTime = lightboxVideo.currentTime;
          setCurrentTime(lightboxVideo.currentTime);
        }
        lightboxVideo?.pause();
        setLightboxOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [lightboxOpen]);

  const updateMetadata = (video: HTMLVideoElement) => {
    const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;
    setDuration(nextDuration);

    if (!visualTest) return;
    const maximum = nextDuration > 0 ? Math.max(0, nextDuration - 0.01) : visualTestTime;
    const deterministicTime = Math.min(visualTestTime, maximum);
    video.currentTime = deterministicTime;
    video.pause();
    setCurrentTime(deterministicTime);
    setPlaying(false);
  };

  const updateTime = (video: HTMLVideoElement) => {
    if (!Number.isFinite(video.currentTime)) return;
    setCurrentTime(video.currentTime);
  };

  const handleMediaError = () => {
    inlineVideoRef.current?.pause();
    lightboxVideoRef.current?.pause();
    setFailed(true);
    setReady(false);
    setPlaying(false);
    setLightboxOpen(false);
  };

  const togglePlayback = () => {
    const nextPlaying = !playing;
    setManualPlayback(nextPlaying || manualPlayback);
    setWantsPlayback(nextPlaying);
    setPlaying(nextPlaying);
  };

  const seekTo = (value: number) => {
    const boundedTime = Math.max(0, Math.min(duration || value, value));
    if (inlineVideoRef.current) inlineVideoRef.current.currentTime = boundedTime;
    if (lightboxVideoRef.current) lightboxVideoRef.current.currentTime = boundedTime;
    setCurrentTime(boundedTime);
  };

  const openLightbox = () => {
    setManualPlayback(true);
    setLightboxFailed(false);
    setLightboxOpen(true);
  };

  const handleLightboxMediaError = () => {
    lightboxVideoRef.current?.pause();
    setLightboxFailed(true);
    setPlaying(false);
    setWantsPlayback(false);
  };

  const closeLightbox = () => {
    const lightboxVideo = lightboxVideoRef.current;
    if (lightboxVideo && inlineVideoRef.current) {
      inlineVideoRef.current.currentTime = lightboxVideo.currentTime;
      setCurrentTime(lightboxVideo.currentTime);
    }
    lightboxVideo?.pause();
    setLightboxOpen(false);
  };

  const renderControls = (inLightbox: boolean) => (
    <div className={styles.controls} data-testid={inLightbox ? "lightbox-video-controls" : "video-controls"}>
      <button
        type="button"
        className={styles.controlButton}
        aria-label={playing ? labels.pause : labels.play}
        aria-pressed={playing}
        title={playing ? labels.pause : labels.play}
        onClick={togglePlayback}
        disabled={visualTest}
      >
        {playing ? <Pause aria-hidden="true" size={18} /> : <Play aria-hidden="true" size={18} />}
      </button>
      <input
        className={styles.scrubber}
        type="range"
        min="0"
        max={duration || 0}
        step="0.01"
        value={Math.min(currentTime, duration || currentTime)}
        aria-label={labels.seek}
        aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
        onChange={(event) => seekTo(Number(event.currentTarget.value))}
        disabled={duration <= 0 || visualTest}
      />
      {!inLightbox && (
        <button
          ref={expandButtonRef}
          type="button"
          className={styles.controlButton}
          aria-label={labels.expand}
          aria-controls={dialogId}
          aria-expanded={lightboxOpen}
          aria-haspopup="dialog"
          title={labels.expand}
          onClick={openLightbox}
        >
          <Maximize2 aria-hidden="true" size={18} />
        </button>
      )}
    </div>
  );

  if (reducedMotion) {
    return (
      <div className={`${styles.root} ${styles.posterOnly}`} data-testid="product-video" data-reduced-motion="true">
        <img className={styles.poster} src={poster} alt={label} />
      </div>
    );
  }

  const lightbox = lightboxOpen && !failed
    ? createPortal(
        <div
          ref={dialogRef}
          id={dialogId}
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${label}: ${labels.dialog}`}
        >
          <button
            type="button"
            className={styles.backdrop}
            aria-label={labels.close}
            tabIndex={-1}
            onClick={closeLightbox}
          />
          <div className={styles.lightboxContent}>
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.closeButton}
              aria-label={labels.close}
              title={labels.close}
              onClick={closeLightbox}
            >
              <X aria-hidden="true" size={24} />
            </button>
            <div className={styles.lightboxPlayer} data-media-failed={lightboxFailed}>
              <img className={styles.lightboxPoster} src={poster} alt={lightboxFailed ? label : ""} />
              {!lightboxFailed && (
                <video
                  ref={lightboxVideoRef}
                  className={styles.lightboxVideo}
                  src={src}
                  poster={poster}
                  aria-label={label}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(event) => updateMetadata(event.currentTarget)}
                  onLoadedData={() => setReady(true)}
                  onSeeked={() => setReady(true)}
                  onTimeUpdate={(event) => updateTime(event.currentTarget)}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onError={handleLightboxMediaError}
                />
              )}
              {!lightboxFailed && renderControls(true)}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <div
        className={styles.root}
        data-testid="product-video"
        data-active={active}
        data-failed={failed}
        data-ready={ready}
      >
        <img className={styles.poster} src={poster} alt={failed ? label : ""} />
        {!failed && (
          <video
            ref={inlineVideoRef}
            className={styles.video}
            src={src}
            poster={poster}
            aria-label={label}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) => updateMetadata(event.currentTarget)}
            onLoadedData={() => setReady(true)}
            onSeeked={() => setReady(true)}
            onTimeUpdate={(event) => updateTime(event.currentTarget)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={handleMediaError}
          />
        )}
        {!failed && renderControls(false)}
      </div>
      {lightbox}
    </>
  );
}
