import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enContent } from "../content/en";
import { Intro } from "./Intro";

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function movePointer(element: HTMLElement, clientX: number, clientY: number) {
  const event = new Event("pointermove", { bubbles: true });
  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  fireEvent(element, event);
}

beforeEach(() => {
  setReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  setReducedMotion(false);
});

describe("Intro wordmark", () => {
  it("tracks the pointer with its eyes and exposes a keyboard tooltip", () => {
    render(<Intro content={enContent.intro} />);
    const wordmark = screen.getByRole("button", { name: "Perplexity Computer" });
    vi.spyOn(wordmark, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      toJSON: () => ({}),
    });

    movePointer(wordmark, 100, 40);
    expect(wordmark.style.getPropertyValue("--eye-x")).toBe("1.40px");
    expect(wordmark.style.getPropertyValue("--eye-y")).toBe("0.80px");

    fireEvent.focus(wordmark);
    expect(screen.getByRole("tooltip")).toHaveTextContent(enContent.intro.running);
    expect(wordmark).toHaveAttribute("aria-describedby", "computer-wordmark-tooltip");

    fireEvent.blur(wordmark);
    fireEvent.pointerLeave(wordmark);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(wordmark.style.getPropertyValue("--eye-x")).toBe("0px");
    expect(wordmark.style.getPropertyValue("--eye-y")).toBe("0px");
  });

  it("restarts the wordmark effect, keeps at most three stamps, and removes them", () => {
    vi.useFakeTimers();
    render(<Intro content={enContent.intro} />);
    const wordmark = screen.getByRole("button", { name: "Perplexity Computer" });

    fireEvent.click(wordmark);
    fireEvent.click(wordmark);
    fireEvent.click(wordmark);
    fireEvent.click(wordmark);
    expect(screen.getAllByTestId("intro-stamp")).toHaveLength(3);
    expect(screen.getAllByTestId("intro-stamp")[0]).toHaveTextContent(enContent.intro.running);

    act(() => vi.advanceTimersByTime(2600));
    expect(screen.queryByTestId("intro-stamp")).not.toBeInTheDocument();
  });

  it("keeps the wordmark static when reduced motion is requested", () => {
    setReducedMotion(true);
    render(<Intro content={enContent.intro} />);
    const wordmark = screen.getByRole("button", { name: "Perplexity Computer" });
    vi.spyOn(wordmark, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      toJSON: () => ({}),
    });

    movePointer(wordmark, 100, 40);
    fireEvent.click(wordmark);

    expect(wordmark.style.getPropertyValue("--eye-x")).toBe("0px");
    expect(wordmark.style.getPropertyValue("--eye-y")).toBe("0px");
    expect(screen.queryByTestId("intro-stamp")).not.toBeInTheDocument();
  });
});
