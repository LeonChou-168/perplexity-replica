import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UnifiesScene } from "./UnifiesScene";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UnifiesScene", () => {
  it("renders the deterministic layered scene and freezes the official video", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(
      <UnifiesScene title="Computer unifies" reducedMotion={false} visualTest />,
    );

    const section = container.querySelector("section");
    const video = container.querySelector("video");

    expect(section).toHaveAttribute("data-progress", "0.580");
    expect(container.querySelector('[data-unifies-layer="background"]')).not.toBeNull();
    expect(container.querySelector('[data-unifies-layer="dreamcloud"]')).not.toBeNull();
    expect(container.querySelector('[data-unifies-layer="helix-back"]')).not.toBeNull();
    expect(container.querySelector('[data-unifies-layer="title"]')).not.toBeNull();
    expect(container.querySelector('[data-unifies-layer="helix-front"]')).not.toBeNull();
    expect(container.querySelectorAll("[data-unifies-char]")).toHaveLength(15);
    expect(video).not.toBeNull();
    expect(video).toHaveProperty("muted", true);
    expect(video).not.toHaveAttribute("autoplay");

    Object.defineProperty(video!, "duration", { configurable: true, value: 8.042 });
    fireEvent.loadedMetadata(video!);

    expect(video!.currentTime).toBeCloseTo(8.042 * 0.58, 2);
    expect(section).toHaveAttribute("data-media-state", "video");
  });

  it("uses the poster when the video fails", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(
      <UnifiesScene title="Computer unifies" reducedMotion={false} visualTest />,
    );

    const video = container.querySelector("video");
    const poster = container.querySelector("img");
    expect(video).not.toBeNull();
    expect(poster).toHaveAttribute("src", "/assets/images/step-bg-01.webp");

    fireEvent.error(video!);

    expect(video).toHaveAttribute("hidden");
    expect(container.querySelector("section")).toHaveAttribute("data-media-state", "poster");
    expect(poster).toBeVisible();
  });

  it("omits the entire scroll scene for reduced motion", () => {
    const { container } = render(
      <UnifiesScene title="Computer unifies" reducedMotion visualTest={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("removes its resize listener when the scene unmounts", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <UnifiesScene title="Computer unifies" reducedMotion={false} visualTest />,
    );
    const resizeRegistration = addListener.mock.calls.find(
      ([event, , options]) => event === "resize" && typeof options === "object" && options?.passive === true,
    );

    expect(resizeRegistration).toBeDefined();
    unmount();
    expect(removeListener).toHaveBeenCalledWith("resize", resizeRegistration?.[1]);
  });
});
