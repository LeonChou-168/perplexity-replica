import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { contentByLocale } from "../content";
import { HowItWorks } from "./HowItWorks";

describe("HowItWorks", () => {
  it("renders the deterministic sticky stack without starting videos", () => {
    const { container } = render(
      <HowItWorks content={contentByLocale.en.workflow} reducedMotion={false} visualTest />,
    );

    const section = container.querySelector("section");
    const videos = [...container.querySelectorAll("video")];

    expect(section).toHaveAttribute("data-active-step", contentByLocale.en.workflow.steps[0].id);
    expect(container.querySelectorAll("article")).toHaveLength(3);
    expect(container.querySelectorAll('[data-testid="product-video"][data-active="true"]')).toHaveLength(1);
    expect(videos.every((video) => !video.autoplay && video.muted)).toBe(true);
  });

  it("lays out every step without autoplay for reduced motion", () => {
    const { container } = render(
      <HowItWorks content={contentByLocale.en.workflow} reducedMotion visualTest={false} />,
    );

    expect(container.querySelectorAll("article")).toHaveLength(3);
    expect(container.querySelectorAll("video")).toHaveLength(0);
    expect(container.querySelectorAll('[data-reduced-motion="true"]')).toHaveLength(3);
  });

  it("keeps the poster visible when a workflow video fails", () => {
    const { container } = render(
      <HowItWorks content={contentByLocale.en.workflow} reducedMotion={false} visualTest />,
    );

    const video = container.querySelector("video");
    const player = video?.closest('[data-testid="product-video"]');
    expect(video).not.toBeNull();
    expect(player).not.toBeNull();

    fireEvent.error(video!);
    expect(player?.querySelector("video")).not.toBeInTheDocument();
    expect(player?.querySelector(`img[alt="${contentByLocale.en.workflow.steps[0].alt}"]`)).toBeVisible();
  });
});
