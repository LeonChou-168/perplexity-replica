import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { enContent } from "../content/en";
import { zhContent } from "../content/zh-CN";
import { CookieBanner } from "./CookieBanner";

const storageKey = "pplx-computer-replica-cookie-choice-v2";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

describe("CookieBanner", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  it("stores acceptance, dismisses immediately, and stays hidden on the next mount", () => {
    const view = render(<CookieBanner content={enContent.cookie} />);
    expect(screen.getByRole("dialog", { name: enContent.cookie.title })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: enContent.cookie.accept }));
    expect(screen.queryByRole("dialog", { name: enContent.cookie.title })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(storageKey)).toBe("accepted");

    view.unmount();
    render(<CookieBanner content={enContent.cookie} />);
    expect(screen.queryByRole("dialog", { name: enContent.cookie.title })).not.toBeInTheDocument();
  });

  it("stores rejection and dismisses without creating tracking state", () => {
    render(<CookieBanner content={enContent.cookie} />);
    fireEvent.click(screen.getByRole("button", { name: enContent.cookie.reject }));

    expect(window.localStorage.getItem(storageKey)).toBe("rejected");
    expect(screen.queryByTestId("cookie-banner")).not.toBeInTheDocument();
    expect(document.cookie).toBe("");
  });

  it("renders localized accessible copy when no choice exists", () => {
    render(<CookieBanner content={zhContent.cookie} />);

    expect(screen.getByRole("dialog", { name: zhContent.cookie.title })).toBeVisible();
    expect(screen.getByRole("button", { name: zhContent.cookie.reject })).toBeVisible();
    expect(screen.getByRole("button", { name: zhContent.cookie.accept })).toBeVisible();
  });
});
