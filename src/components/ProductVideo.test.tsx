import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductVideo, type ProductVideoLabels } from "./ProductVideo";

const labels: ProductVideoLabels = {
  play: "Play video",
  pause: "Pause video",
  seek: "Seek video",
  expand: "Open video",
  close: "Close video",
  dialog: "Expanded video",
};

const defaultProps = {
  src: "/assets/video/step-01.webm",
  poster: "/assets/images/step-01.webp",
  label: "Describe your task",
  labels,
  active: false,
  reducedMotion: false,
  visualTest: false,
};

describe("ProductVideo", () => {
  beforeEach(() => {
    vi.mocked(HTMLMediaElement.prototype.play).mockClear();
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
  });

  it("provides keyboard-focusable custom playback controls", () => {
    render(<ProductVideo {...defaultProps} />);

    const playButton = screen.getByRole("button", { name: labels.play });
    playButton.focus();
    expect(playButton).toHaveFocus();

    fireEvent.click(playButton);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: labels.pause })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: labels.pause }));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: labels.play })).toHaveAttribute("aria-pressed", "false");
  });

  it("plays only while its workflow card is active", () => {
    const { rerender } = render(<ProductVideo {...defaultProps} active />);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    rerender(<ProductVideo {...defaultProps} active={false} />);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("seeks with an accessible range input", () => {
    const { container } = render(<ProductVideo {...defaultProps} />);
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "duration", { configurable: true, value: 12 });
    fireEvent.loadedMetadata(video);

    const scrubber = screen.getByRole("slider", { name: labels.seek });
    expect(scrubber).toHaveAttribute("max", "12");
    fireEvent.change(scrubber, { target: { value: "4.5" } });
    expect(video.currentTime).toBe(4.5);
    expect(scrubber).toHaveAttribute("aria-valuetext", "0:04 / 0:12");
  });

  it("keeps an independent labelled poster after a media failure", () => {
    const { container } = render(<ProductVideo {...defaultProps} />);
    fireEvent.error(container.querySelector("video")!);

    expect(container.querySelector("video")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: defaultProps.label })).toBeVisible();
    expect(screen.queryByTestId("video-controls")).not.toBeInTheDocument();
  });

  it("opens a modal lightbox, closes with Escape, and restores focus", () => {
    const { container } = render(<ProductVideo {...defaultProps} />);
    container.querySelector("video")!.currentTime = 3.5;
    const expandButton = screen.getByRole("button", { name: labels.expand });
    expandButton.focus();
    fireEvent.click(expandButton);

    const dialog = screen.getByRole("dialog", { name: `${defaultProps.label}: ${labels.dialog}` });
    expect(dialog).toBeVisible();
    expect(dialog.querySelector("video")?.currentTime).toBe(3.5);
    expect(within(dialog).getByTitle(labels.close)).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(expandButton).toHaveFocus();
  });

  it("keeps the lightbox open on its poster when the expanded media fails", () => {
    const { container } = render(<ProductVideo {...defaultProps} />);
    const expandButton = screen.getByRole("button", { name: labels.expand });
    fireEvent.click(expandButton);

    const dialog = screen.getByRole("dialog", { name: `${defaultProps.label}: ${labels.dialog}` });
    fireEvent.error(within(dialog).getByLabelText(defaultProps.label));

    expect(dialog).toBeVisible();
    expect(dialog.querySelector("video")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: defaultProps.label })).toBeVisible();
    expect(within(dialog).queryByTestId("lightbox-video-controls")).not.toBeInTheDocument();
    expect(container.querySelector("video")).toBeInTheDocument();
  });

  it("seeks to a deterministic paused frame in visual-test mode", () => {
    const { container } = render(
      <ProductVideo {...defaultProps} active visualTest visualTestTime={2.25} />,
    );
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "duration", { configurable: true, value: 10 });
    fireEvent.loadedMetadata(video);

    expect(video.currentTime).toBe(2.25);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("renders only the poster when reduced motion is requested", () => {
    const { container } = render(<ProductVideo {...defaultProps} active reducedMotion />);

    expect(container.querySelector("video")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: defaultProps.label })).toBeVisible();
    expect(screen.queryByTestId("video-controls")).not.toBeInTheDocument();
  });
});
