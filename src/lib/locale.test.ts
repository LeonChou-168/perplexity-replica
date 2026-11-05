import { describe, expect, it } from "vitest";
import { resolveLocale } from "./locale";

describe("resolveLocale", () => {
  it.each([
    [["zh-CN"], "zh-CN"],
    [["zh-Hant-TW"], "zh-CN"],
    [["ZH-hans"], "zh-CN"],
    [["en-US"], "en"],
    [["EN-gb"], "en"],
  ] as const)("maps %j to %s", (languages, expected) => {
    expect(resolveLocale(languages)).toBe(expected);
  });

  it("uses the first supported browser language", () => {
    expect(resolveLocale(["fr-FR", "zh-Hant", "en-US"])).toBe("zh-CN");
    expect(resolveLocale(["de-DE", "en-GB", "zh-CN"])).toBe("en");
  });

  it("defaults to English when no supported language exists", () => {
    expect(resolveLocale([])).toBe("en");
    expect(resolveLocale(["fr-FR", "ja-JP"])).toBe("en");
  });

  it("does not treat unrelated language prefixes as supported", () => {
    expect(resolveLocale(["zho", "eng", "zhongwen"])).toBe("en");
  });
});
