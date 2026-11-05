import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enContent } from "../content/en";
import { Header } from "./Header";

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

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });
  document.body.style.overflow = "";
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("Header state machine", () => {
  it("enters, responds to scroll direction, and adopts dark-section chrome", async () => {
    render(
      <>
        <Header content={enContent} />
        <main>
          <section data-header-theme="dark" />
        </main>
      </>,
    );
    const header = document.querySelector("header")!;

    await waitFor(() => expect(header).toHaveAttribute("data-entered", "true"));
    await waitFor(() => expect(scrollTrigger.create).toHaveBeenCalled());
    const themeCall = scrollTrigger.create.mock.calls.find(
      ([config]) => (config as { id?: string }).id === "header-theme-0",
    );
    if (!themeCall) throw new Error("Expected a dark-section ScrollTrigger");
    const themeConfig = themeCall[0] as { onToggle: (state: { isActive: boolean }) => void };

    act(() => themeConfig.onToggle({ isActive: true }));
    expect(header).toHaveAttribute("data-theme", "dark");

    window.scrollY = 120;
    fireEvent.scroll(window);
    await waitFor(() => expect(header).toHaveAttribute("data-scrolled", "true"));

    window.scrollY = 220;
    fireEvent.scroll(window);
    await waitFor(() => expect(header).toHaveAttribute("data-hidden", "true"));

    window.scrollY = 100;
    fireEvent.scroll(window);
    await waitFor(() => expect(header).toHaveAttribute("data-hidden", "false"));

    act(() => themeConfig.onToggle({ isActive: false }));
    expect(header).toHaveAttribute("data-theme", "light");
  });

  it("traps mobile-menu focus, makes background content inert, and restores focus on Escape", async () => {
    render(
      <>
        <Header content={enContent} />
        <main data-testid="page-main"><button type="button">Background action</button></main>
        <footer data-testid="page-footer">Footer</footer>
      </>,
    );
    const toggle = screen.getByRole("button", { name: enContent.accessibility.openMenu });
    toggle.focus();
    fireEvent.click(toggle);

    const mobileNav = await screen.findByRole("navigation", { name: "Mobile navigation" });
    const firstMenuItem = within(mobileNav).getByRole("button", { name: enContent.header.products });
    await waitFor(() => expect(firstMenuItem).toHaveFocus());

    const pageMain = screen.getByTestId("page-main");
    const pageFooter = screen.getByTestId("page-footer");
    expect(pageMain.inert).toBe(true);
    expect(pageFooter.inert).toBe(true);
    expect(pageMain).toHaveAttribute("aria-hidden", "true");
    expect(document.body.style.overflow).toBe("hidden");

    const lastMenuItem = within(mobileNav).getByRole("link", { name: enContent.header.cta });
    lastMenuItem.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(toggle).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument());
    await waitFor(() => expect(toggle).toHaveFocus());
    expect(pageMain.inert).toBeFalsy();
    expect(pageMain).not.toHaveAttribute("aria-hidden");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes a desktop dropdown with Escape and restores its trigger focus", () => {
    render(<Header content={enContent} />);
    const primaryNav = screen.getByRole("navigation", { name: "Primary navigation" });
    const products = within(primaryNav).getByRole("button", { name: enContent.header.products });

    products.focus();
    fireEvent.click(products);
    expect(screen.getByRole("link", { name: "Search" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("link", { name: "Search" })).not.toBeInTheDocument();
    expect(products).toHaveFocus();
  });
});
