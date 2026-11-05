import { describe, expect, it } from "vitest";
import type { SiteContent } from "../types";
import { contentByLocale } from ".";

type StructuralShape = string | StructuralShape[] | { [key: string]: StructuralShape };

function structuralShape(value: unknown): StructuralShape {
  if (Array.isArray(value)) return value.map(structuralShape);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, structuralShape(child)]),
    );
  }
  return typeof value;
}

function pickLinks(content: SiteContent) {
  return {
    products: content.header.productLinks.map(({ id, href }) => ({ id, href })),
    resources: content.header.resourceLinks.map(({ id, href }) => ({ id, href })),
    capabilities: content.capabilities.items.map(({ id, href }) => ({ id, href })),
    footer: content.footer.groups.map(({ id, links, sections }) => ({
      id,
      links: links.map(({ id: linkId, href }) => ({ id: linkId, href })),
      sections: sections?.map(({ links: sectionLinks }) => ({
        links: sectionLinks.map(({ id: linkId, href }) => ({ id: linkId, href })),
      })),
    })),
  };
}

describe("localized site content", () => {
  const { en, "zh-CN": zh } = contentByLocale;

  it("exposes exactly the supported locales", () => {
    expect(Object.keys(contentByLocale).sort()).toEqual(["en", "zh-CN"]);
    expect(en.locale).toBe("en");
    expect(zh.locale).toBe("zh-CN");
  });

  it("keeps the English and Chinese content schemas structurally identical", () => {
    expect(structuralShape(zh)).toEqual(structuralShape(en));
  });

  it("keeps stable ids, destinations, and media sources identical across locales", () => {
    expect(pickLinks(zh)).toEqual(pickLinks(en));
    expect(zh.hero.queries.map(({ id }) => id)).toEqual(en.hero.queries.map(({ id }) => id));
    expect(zh.workflow.steps.map(({ id, background, poster, video }) => ({ id, background, poster, video }))).toEqual(
      en.workflow.steps.map(({ id, background, poster, video }) => ({ id, background, poster, video })),
    );
    expect(zh.capabilities.items.map(({ id, image }) => ({ id, image }))).toEqual(
      en.capabilities.items.map(({ id, image }) => ({ id, image })),
    );
  });

  it.each(Object.entries(contentByLocale))("defines coherent CTAs for %s", (_locale, content) => {
    expect(content.header.cta).toBe(content.hero.cta);
    expect(content.hero.cta).toBe(content.finalCta.cta);

    const destinations = [
      ...content.header.productLinks,
      ...content.header.resourceLinks,
      ...content.capabilities.items,
      ...content.footer.groups.flatMap(({ links }) => links),
      ...content.footer.groups.flatMap(({ sections }) => sections?.flatMap(({ links }) => links) ?? []),
    ];
    expect(destinations.length).toBeGreaterThan(0);
    for (const { href } of destinations) expect(href).toMatch(/^https:\/\//);
  });

  it.each(Object.entries(contentByLocale))("uses local absolute media paths for %s", (_locale, content) => {
    const paths = [
      ...content.workflow.steps.flatMap(({ background, poster, video }) => [background, poster, video]),
      ...content.capabilities.items.map(({ image }) => image),
    ];

    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) expect(path).toMatch(/^\/assets\//);
  });
});
