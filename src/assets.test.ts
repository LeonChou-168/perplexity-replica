import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import manifest from "../public/assets/manifest.json";
import { contentByLocale } from "./content";

function contentMediaPaths() {
  return Object.values(contentByLocale).flatMap((content) => [
    ...content.workflow.steps.flatMap(({ background, poster, video }) => [background, poster, video]),
    ...content.capabilities.items.map(({ image }) => image),
  ]);
}

describe("localized asset manifest", () => {
  it("records a complete, uniquely addressed local asset set", () => {
    expect(manifest.version).toBe(2);
    expect(manifest.snapshotId).toBe("computer-2026-07-23T23-09-22+08-00");
    expect(manifest.sourceBundle).toBe("style-ChJ3YH0S.css");
    expect(manifest.sourcePage).toBe("https://www.perplexity.ai/products/computer");
    expect(Number.isNaN(Date.parse(manifest.fetchedAt))).toBe(false);
    expect(manifest.assets).toHaveLength(74);

    const paths = manifest.assets.map(({ localPath }) => localPath);
    expect(new Set(paths).size).toBe(paths.length);
    expect(manifest.assets.filter(({ kind }) => kind === "video")).toHaveLength(5);
    expect(manifest.assets.filter(({ kind }) => kind === "font")).toHaveLength(4);
    expect(manifest.assets.filter(({ kind }) => kind === "audio")).toHaveLength(1);

    for (const asset of manifest.assets) {
      expect(asset.sourceUrl).toMatch(/^https:\/\//);
      expect(asset.localPath).toMatch(/^\/assets\/(audio|fonts|icons|images|video)\//);
      expect(asset.mimeType).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/i);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);

      const bytes = readFileSync(join(process.cwd(), "public", asset.localPath.replace(/^\//, "")));
      expect(bytes.byteLength).toBe(asset.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
    }
  });

  it("covers every media path referenced by both locale dictionaries", () => {
    const manifestPaths = new Set(manifest.assets.map(({ localPath }) => localPath));
    for (const path of contentMediaPaths()) expect(manifestPaths).toContain(path);
  });
});
