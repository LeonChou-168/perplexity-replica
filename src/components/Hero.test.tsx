import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enContent } from "../content/en";
import { Hero } from "./Hero";

const scrollTrigger = vi.hoisted(() => ({
  create: vi.fn((_config: unknown) => ({ kill: vi.fn() })),
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    utils: {
      toArray: (selector: string) => Array.from(document.querySelectorAll(selector)),
    },
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: scrollTrigger.create },
}));

function renderHero(options: { reducedMotion?: boolean; visualTest?: boolean } = {}) {
  return render(
    <Hero
      content={enContent.hero}
      accessibility={enContent.accessibility}
      reducedMotion={options.reducedMotion ?? false}
      visualTest={options.visualTest ?? true}
    />,
  );
}

function queryIds(stack: HTMLElement) {
  return Array.from(stack.querySelectorAll<HTMLElement>("[data-query-id]"), (card) => card.dataset.queryId);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  Reflect.deleteProperty(document, "visibilityState");
});

describe("Hero media behavior", () => {
  it("keeps video muted and synchronizes the separate audio only after a user action", () => {
    const { container } = renderHero();
    const video = container.querySelector("video")!;
    const audio = container.querySelector("audio")!;
    const audioPlay = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(audio, "play", { configurable: true, value: audioPlay });
    Object.defineProperty(audio, "duration", { configurable: true, value: 100 });
    video.currentTime = 12;
    audio.currentTime = 0;

    expect(video.muted).toBe(true);
    const soundButton = screen.getByRole("button", { name: enContent.accessibility.soundOn });
    fireEvent.click(soundButton);

    expect(audio.currentTime).toBe(12);
    expect(audioPlay).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: enContent.accessibility.soundOff })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(video.muted).toBe(true);

    video.currentTime = 40;
    fireEvent.timeUpdate(video);
    expect(audio.currentTime).toBe(40);
  });

  it("pauses audio and falls back to the poster when video playback fails", () => {
    const { container } = renderHero();
    const video = container.querySelector("video")!;
    const audio = container.querySelector("audio")!;
    const audioPause = vi.fn();
    Object.defineProperty(audio, "pause", { configurable: true, value: audioPause });

    fireEvent.error(video);

    expect(audioPause).toHaveBeenCalledOnce();
    expect(container.querySelector("video")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: enContent.accessibility.soundOn })).not.toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/assets/images/computer-hero-bg-fallback-2.webp",
    );
  });

  it("pauses failed audio and removes its control without removing the video", () => {
    const { container } = renderHero();
    const audio = container.querySelector("audio")!;
    const audioPause = vi.fn();
    Object.defineProperty(audio, "pause", { configurable: true, value: audioPause });

    fireEvent.error(audio);

    expect(audioPause).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: enContent.accessibility.soundOn })).not.toBeInTheDocument();
    expect(container.querySelector("video")).toBeInTheDocument();
  });

  it("pauses while the page is hidden and resumes synchronized media when visible", () => {
    const { container } = renderHero({ visualTest: false });
    const video = container.querySelector("video")!;
    const audio = container.querySelector("audio")!;
    const videoPlay = vi.fn().mockResolvedValue(undefined);
    const videoPause = vi.fn();
    const audioPlay = vi.fn().mockResolvedValue(undefined);
    const audioPause = vi.fn();
    Object.defineProperties(video, {
      play: { configurable: true, value: videoPlay },
      pause: { configurable: true, value: videoPause },
    });
    Object.defineProperties(audio, {
      play: { configurable: true, value: audioPlay },
      pause: { configurable: true, value: audioPause },
      duration: { configurable: true, value: 100 },
    });

    fireEvent.click(screen.getByRole("button", { name: enContent.accessibility.soundOn }));
    videoPlay.mockClear();
    videoPause.mockClear();
    audioPlay.mockClear();
    audioPause.mockClear();

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    fireEvent(document, new Event("visibilitychange"));
    expect(videoPause).toHaveBeenCalledOnce();
    expect(audioPause).toHaveBeenCalledOnce();

    video.currentTime = 31;
    audio.currentTime = 0;
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    fireEvent(document, new Event("visibilitychange"));
    expect(videoPlay).toHaveBeenCalledOnce();
    expect(audioPlay).toHaveBeenCalledOnce();
    expect(audio.currentTime).toBe(31);
  });

  it("uses the static poster without media controls when reduced motion is requested", () => {
    const { container } = renderHero({ reducedMotion: true });

    expect(container.querySelector("video")).not.toBeInTheDocument();
    expect(container.querySelector("audio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: enContent.accessibility.soundOn })).not.toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/assets/images/computer-hero-bg-fallback-2.webp",
    );
  });
});

describe("Hero animation state", () => {
  it("cross-fades verbs with two slots over the official 2.4s plus 0.6s cadence", () => {
    vi.useFakeTimers();
    const { container } = renderHero({ visualTest: false });

    expect(container.querySelector('[data-verb-slot="current"]')).toHaveTextContent("Researches");
    expect(container.querySelector('[data-verb-slot="previous"]')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2400));
    expect(container.querySelector('[data-verb-slot="previous"]')).toHaveTextContent("Researches");
    expect(container.querySelector('[data-verb-slot="current"]')).toHaveTextContent("Codes");

    act(() => vi.advanceTimersByTime(600));
    expect(container.querySelector('[data-verb-slot="previous"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-verb-slot="current"]')).toHaveTextContent("Codes");
  });

  it("cycles only the three desktop cards while retaining the doubled mobile marquee", () => {
    vi.useFakeTimers();
    const { container } = renderHero({ visualTest: false });
    const stack = screen.getByTestId("desktop-query-stack");
    const mobileTrack = screen.getByTestId("mobile-query-track");

    expect(queryIds(stack)).toEqual(["01", "02", "03"]);
    expect(mobileTrack.querySelectorAll("[data-query-id]")).toHaveLength(enContent.hero.queries.length * 2);

    act(() => vi.advanceTimersByTime(Math.ceil(240_000 / enContent.hero.queries.length)));
    expect(stack).toHaveAttribute("data-query-phase", "leaving");

    act(() => vi.advanceTimersByTime(320));
    expect(queryIds(stack)).toEqual(["02", "03", "04"]);
    expect(stack).toHaveAttribute("data-query-phase", "entering");

    act(() => vi.advanceTimersByTime(1000));
    expect(stack).toHaveAttribute("data-query-phase", "idle");
    expect(container.querySelectorAll(".sr-only li")).toHaveLength(enContent.hero.queries.length);
  });

  it("freezes frame, verbs, and cards in deterministic visual-test mode", () => {
    vi.useFakeTimers();
    const { container } = renderHero();
    const video = container.querySelector("video")!;
    const videoPause = vi.fn();
    Object.defineProperties(video, {
      duration: { configurable: true, value: 10 },
      pause: { configurable: true, value: videoPause },
    });

    fireEvent.loadedMetadata(video);
    act(() => vi.advanceTimersByTime(300_000));

    expect(video.currentTime).toBe(2.4);
    expect(videoPause).toHaveBeenCalled();
    expect(container.querySelector('[data-verb-slot="current"]')).toHaveTextContent("Researches");
    expect(queryIds(screen.getByTestId("desktop-query-stack"))).toEqual(["01", "02", "03"]);
    expect(container.querySelector("section")).toHaveAttribute("data-deterministic", "true");
  });
});
