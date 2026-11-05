import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Locale } from "../types";
import { useLocale } from "./useLocale";

const originalLanguages = Object.getOwnPropertyDescriptor(Navigator.prototype, "languages");
const originalOwnLanguages = Object.getOwnPropertyDescriptor(navigator, "languages");

function setLanguages(languages: string[]) {
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    value: languages,
  });
}

describe("useLocale", () => {
  afterEach(() => {
    if (originalOwnLanguages) Object.defineProperty(navigator, "languages", originalOwnLanguages);
    else Reflect.deleteProperty(navigator, "languages");
    if (originalLanguages) Object.defineProperty(Navigator.prototype, "languages", originalLanguages);
  });

  it("updates from browser language changes", () => {
    setLanguages(["en-US"]);
    const { result } = renderHook(() => useLocale());
    expect(result.current).toBe("en");

    setLanguages(["zh-Hans"]);
    act(() => window.dispatchEvent(new Event("languagechange")));
    expect(result.current).toBe("zh-CN");
  });

  it("lets deterministic fixtures force a supported locale", () => {
    setLanguages(["en-US"]);
    const { result, rerender } = renderHook(
      ({ forcedLocale }: { forcedLocale?: Locale }) => useLocale(forcedLocale),
      { initialProps: { forcedLocale: "zh-CN" as Locale | undefined } },
    );

    expect(result.current).toBe("zh-CN");
    rerender({ forcedLocale: undefined });
    expect(result.current).toBe("en");
  });
});
