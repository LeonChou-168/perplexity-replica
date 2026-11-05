import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const diagnosticsByPage = new WeakMap<Page, { runtimeErrors: string[]; externalRequests: string[] }>();

const expected = {
  en: {
    htmlLang: "en",
    title: "Computer | Perplexity AI",
    description:
      "Perplexity Computer is an agentic AI assistant that can use a computer to complete tasks, from planning trips to building apps.",
    cta: "Try Computer",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    primaryNavigation: "Primary navigation",
    mobileNavigation: "Mobile navigation",
    products: "Products",
    resources: "Resources",
    search: "Search",
    blog: "Blog",
    firstVerb: "Researches",
    deterministicVerb: "Browses",
    capabilityCta: "Explore gallery",
    soundOn: "Turn sound on",
    soundOff: "Turn sound off",
    playVideo: "Play video",
    pauseVideo: "Pause video",
    seekVideo: "Seek video",
    openVideo: "Open video",
    closeVideo: "Close video",
    cookieReject: "Reject optional",
  },
  zh: {
    htmlLang: "zh-CN",
    title: "Computer | Perplexity AI",
    description: "Perplexity Computer——一款代理式 AI 助手，可使用你的电脑替你完成任务，从预订行程到构建应用。",
    cta: "试用 Computer",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    primaryNavigation: "主导航",
    mobileNavigation: "移动导航",
    products: "Products",
    resources: "Resources",
    search: "Search",
    blog: "Blog",
    firstVerb: "研究",
    deterministicVerb: "浏览",
    capabilityCta: "浏览图库",
    soundOn: "开启声音",
    soundOff: "关闭声音",
    playVideo: "播放视频",
    pauseVideo: "暂停视频",
    seekVideo: "调整视频进度",
    openVideo: "放大视频",
    closeVideo: "关闭视频",
    cookieReject: "拒绝可选项",
  },
} as const;

function copyFor(testInfo: TestInfo) {
  return testInfo.project.name.endsWith("zh-CN") ? expected.zh : expected.en;
}

async function loadPage(page: Page, path = "/?visualTest=1") {
  const runtimeErrors: string[] = [];
  const externalRequests: string[] = [];

  await page.addInitScript(() => {
    const metrics = window as typeof window & { __replicaCLS?: number };
    metrics.__replicaCLS = 0;
    if (!("PerformanceObserver" in window) || !PerformanceObserver.supportedEntryTypes.includes("layout-shift")) return;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) metrics.__replicaCLS = (metrics.__replicaCLS ?? 0) + shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.origin !== "http://127.0.0.1:4179") {
      externalRequests.push(url.href);
    }
  });

  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-visual-test",
    path.includes("visualTest=1") ? "true" : "false",
  );
  diagnosticsByPage.set(page, { runtimeErrors, externalRequests });
  return { runtimeErrors, externalRequests };
}

async function dismissCookie(page: Page, rejectLabel: string) {
  const reject = page.getByRole("button", { name: rejectLabel, exact: true });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

test.describe("Perplexity Computer replica", () => {
  test.afterEach(async ({ page }) => {
    const diagnostics = diagnosticsByPage.get(page);
    if (!diagnostics) return;
    expect(diagnostics.externalRequests).toEqual([]);
    expect(diagnostics.runtimeErrors).toEqual([]);
  });

  test("localizes metadata, stays local, and keeps layout stable", async ({ page }, testInfo) => {
    const copy = copyFor(testInfo);
    const { runtimeErrors, externalRequests } = await loadPage(page);

    await expect(page.locator("html")).toHaveAttribute("lang", copy.htmlLang);
    await expect(page).toHaveTitle(copy.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", copy.description);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");

    await expect(page.getByRole("main").getByText("Computer", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("main").getByText(copy.firstVerb, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: copy.cta, exact: true }).first()).toBeVisible();

    const nonLocalMedia = await page.locator("img[src], video[src], audio[src], source[src]").evaluateAll((elements) =>
      elements
        .map((element) => new URL((element as HTMLImageElement | HTMLVideoElement | HTMLAudioElement | HTMLSourceElement).src, location.href))
        .filter((url) => url.protocol === "http:" || url.protocol === "https:")
        .filter((url) => url.origin !== location.origin)
        .map((url) => url.href),
    );
    expect(nonLocalMedia).toEqual([]);

    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
    const cls = await page.evaluate(() => (window as typeof window & { __replicaCLS?: number }).__replicaCLS ?? 0);
    expect(cls).toBeLessThan(0.01);
    expect(externalRequests).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  });

  test("supports responsive navigation, keyboard escape, focus restore, and official links", async ({ page }, testInfo) => {
    const copy = copyFor(testInfo);
    await loadPage(page);
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    let navigation: Locator;
    if (viewport!.width <= 960) {
      const toggle = page.locator("[data-menu-control]");
      await toggle.focus();
      await toggle.click();
      await expect(toggle).toHaveAccessibleName(copy.closeMenu);
      navigation = page.getByRole("navigation", { name: copy.mobileNavigation });
      const firstItem = navigation.getByRole("button", { name: copy.products, exact: true });
      await expect(firstItem).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(toggle).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(firstItem).toBeFocused();
    } else {
      navigation = page.getByRole("navigation", { name: copy.primaryNavigation });
    }

    const products = navigation.getByRole("button", { name: copy.products, exact: true });
    await expect(products).toBeVisible();
    await products.click();
    await expect(navigation.getByRole("link", { name: copy.search, exact: true })).toHaveAttribute(
      "href",
      "https://www.perplexity.ai/hub/products/search",
    );

    const resources = navigation.getByRole("button", { name: copy.resources, exact: true });
    await resources.click();
    await expect(navigation.getByRole("link", { name: copy.blog, exact: true })).toHaveAttribute(
      "href",
      "https://www.perplexity.ai/hub/blog",
    );

    await page.keyboard.press("Escape");
    if (viewport!.width <= 960) {
      await expect(page.getByRole("navigation", { name: copy.mobileNavigation })).toHaveCount(0);
      await expect(page.locator("[data-menu-control]")).toBeFocused();
      await expect(page.locator("[data-menu-control]")).toHaveAccessibleName(copy.openMenu);
    } else {
      await expect(resources).toBeFocused();
      await expect(navigation.getByRole("link", { name: copy.blog, exact: true })).toHaveCount(0);
    }

    const ctas = page.getByRole("link", { name: copy.cta, exact: true });
    expect(await ctas.count()).toBeGreaterThanOrEqual(2);
    for (let index = 0; index < (await ctas.count()); index += 1) {
      await expect(ctas.nth(index)).toHaveAttribute("href", "https://www.perplexity.ai/computer");
    }

    await expect(page.getByRole("link", { name: copy.capabilityCta }).first()).toHaveAttribute(
      "href",
      "https://www.perplexity.ai/computer/gallery",
    );
  });

  test("uses every deterministic state fixture", async ({ page }) => {
    await loadPage(
      page,
      "/?visualTest=1&locale=en&verbIndex=2&taskIndex=5&unifiesProgress=.75&workflowStep=2&mediaTime=2.25",
    );

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('[data-verb-slot="current"]')).toHaveText("Browses");
    await expect(page.getByTestId("desktop-query-stack").locator("[data-query-id]").first()).toHaveAttribute("data-query-id", "06");
    await expect(page.locator("section[data-progress]")).toHaveAttribute("data-progress", "0.750");
    await expect(page.locator("section[aria-labelledby='workflow-title']")).toHaveAttribute("data-active-step", "iterate");

    const heroVideo = page.locator("main > section").first().locator("video");
    const workflowVideo = page.getByTestId("product-video").first().locator("video");
    await expect.poll(() => heroVideo.evaluate((video) => (video as HTMLVideoElement).currentTime)).toBeCloseTo(2.25, 1);
    await expect.poll(() => workflowVideo.evaluate((video) => (video as HTMLVideoElement).currentTime)).toBeCloseTo(2.25, 1);
    await expect.poll(() => heroVideo.evaluate((video) => (video as HTMLVideoElement).paused)).toBe(true);
    await expect.poll(() => workflowVideo.evaluate((video) => (video as HTMLVideoElement).paused)).toBe(true);
  });

  test("toggles synchronized Hero sound after a user gesture", async ({ page }, testInfo) => {
    const copy = copyFor(testInfo);
    const { runtimeErrors } = await loadPage(page, "/");
    await dismissCookie(page, copy.cookieReject);

    const sound = page.getByRole("button", { name: copy.soundOn, exact: true });
    const hero = page.locator("main > section").first();
    const video = hero.locator("video");
    const audio = hero.locator("audio");
    await expect(sound).toBeVisible();
    await sound.click();
    await expect(page.getByRole("button", { name: copy.soundOff, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => audio.evaluate((media) => (media as HTMLAudioElement).paused)).toBe(false);
    await expect.poll(() => Promise.all([
      video.evaluate((media) => (media as HTMLVideoElement).currentTime),
      audio.evaluate((media) => (media as HTMLAudioElement).currentTime),
    ]).then(([videoTime, audioTime]) => Math.abs(videoTime - audioTime))).toBeLessThan(0.4);
    await page.getByRole("button", { name: copy.soundOff, exact: true }).click();
    await expect(page.getByRole("button", { name: copy.soundOn, exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => audio.evaluate((media) => (media as HTMLAudioElement).paused)).toBe(true);
    expect(runtimeErrors).toEqual([]);
  });

  test("opens the workflow player as a focus-managed lightbox", async ({ page }, testInfo) => {
    const copy = copyFor(testInfo);
    await loadPage(page, "/");
    await dismissCookie(page, copy.cookieReject);
    const workflow = page.locator("section[aria-labelledby='workflow-title']");
    const finalCard = workflow.locator('[data-step="iterate"]');
    await finalCard.scrollIntoViewIfNeeded();

    // The first two official-style sticky cards deliberately overlap as the next card enters.
    const expand = finalCard.getByRole("button", { name: copy.openVideo, exact: true });
    await expand.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTitle(copy.closeVideo)).toBeFocused();
    await page.keyboard.press("Tab");
    const lightboxControls = dialog.getByTestId("lightbox-video-controls");
    const playbackControl = lightboxControls.getByRole("button");
    await expect(playbackControl).toBeFocused();
    await expect(playbackControl).toHaveAccessibleName(new RegExp(`^(${copy.playVideo}|${copy.pauseVideo})$`));

    const seek = lightboxControls.getByRole("slider", { name: copy.seekVideo, exact: true });
    await expect.poll(async () => Number(await seek.getAttribute("max"))).toBeGreaterThan(1);
    await seek.fill("1");
    await expect.poll(() => dialog.locator("video").evaluate((video) => (video as HTMLVideoElement).currentTime)).toBeCloseTo(1, 1);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(expand).toBeFocused();
  });

  test("renders a nonblank layered canvas inside the Unifies scroll range", async ({ page }) => {
    await loadPage(page, "/?visualTest=1&unifiesProgress=.58");
    const section = page.locator("section[data-progress]");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveAttribute("data-scene-active", "true");
    const frontCanvas = section.locator('[data-unifies-layer="helix-front"]');
    const backCanvas = section.locator('[data-unifies-layer="helix-back"]');
    const dreamcloud = section.locator('[data-unifies-layer="dreamcloud"]');
    await expect(frontCanvas).toBeVisible();
    await expect(backCanvas).toBeVisible();
    await expect(dreamcloud).toBeVisible();
    await expect(frontCanvas).toHaveAttribute("data-renderer", "three-webgl");
    await expect(backCanvas).toHaveAttribute("data-renderer", "three-webgl");

    const readPixels = (canvas: Locator) => canvas.evaluate((element) => {
      const target = element as HTMLCanvasElement;
      const gl = target.getContext("webgl2") ?? target.getContext("webgl");
      if (gl) {
        const values = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, values);
        let nonZero = 0;
        let minimum = 255;
        let maximum = 0;
        let checksum = 0;
        for (let index = 0; index < values.length; index += 32) {
          const value = values[index] + values[index + 1] + values[index + 2] + values[index + 3];
          if (value > 0) nonZero += 1;
          minimum = Math.min(minimum, value);
          maximum = Math.max(maximum, value);
          checksum = (checksum + value * ((index % 251) + 1)) % 2_147_483_647;
        }
        return { renderer: target.dataset.renderer, nonZero, variance: maximum - minimum, checksum };
      }

      const context = target.getContext("2d");
      if (!context) return { renderer: target.dataset.renderer, nonZero: 0, variance: 0, checksum: 0 };
      const values = context.getImageData(0, 0, target.width, target.height).data;
      let nonZero = 0;
      let minimum = 255;
      let maximum = 0;
      let checksum = 0;
      for (let index = 0; index < values.length; index += 32) {
        const value = values[index] + values[index + 1] + values[index + 2] + values[index + 3];
        if (value > 0) nonZero += 1;
        minimum = Math.min(minimum, value);
        maximum = Math.max(maximum, value);
        checksum = (checksum + value * ((index % 251) + 1)) % 2_147_483_647;
      }
      return { renderer: target.dataset.renderer, nonZero, variance: maximum - minimum, checksum };
    });

    const initialFront = await readPixels(frontCanvas);
    const initialBack = await readPixels(backCanvas);
    const initialDreamcloud = await readPixels(dreamcloud);
    for (const pixels of [initialFront, initialBack, initialDreamcloud]) {
      expect(pixels.nonZero).toBeGreaterThan(32);
      expect(pixels.variance).toBeGreaterThan(4);
    }

    await page.goto("/?visualTest=1&unifiesProgress=.25", { waitUntil: "domcontentloaded" });
    const nextSection = page.locator("section[data-progress]");
    await nextSection.scrollIntoViewIfNeeded();
    await expect(nextSection).toHaveAttribute("data-scene-active", "true");
    const nextFrontCanvas = nextSection.locator('[data-unifies-layer="helix-front"]');
    await expect(nextFrontCanvas).toHaveAttribute("data-renderer", "three-webgl");
    const nextFront = await readPixels(nextFrontCanvas);
    expect(nextFront.checksum).not.toBe(initialFront.checksum);
  });

  test("persists the local Cookie choice without tracking state", async ({ page }, testInfo) => {
    const copy = copyFor(testInfo);
    await loadPage(page);
    const banner = page.getByTestId("cookie-banner");
    await expect(banner).toBeVisible();
    await page.getByRole("button", { name: copy.cookieReject, exact: true }).click();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("cookie-banner")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.cookie)).toBe("");
  });

  test("does not create horizontal page overflow", async ({ page }) => {
    await loadPage(page);
    await page.evaluate(() => document.fonts.ready);

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      criticalOverflow: Array.from(document.querySelectorAll("header, main > section, footer"))
        .map((element) => element.getBoundingClientRect())
        .some((rect) => rect.left < -1 || rect.right > document.documentElement.clientWidth + 1),
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    expect(dimensions.criticalOverflow).toBe(false);
  });

  test("honors reduced motion with posters, normal flow, and no scroll scene", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loadPage(page, "/");

    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
    await expect(page.locator("section[data-progress]")).toHaveCount(0);
    await expect(page.locator("video")).toHaveCount(0);
    await expect(page.locator("main > section").first().locator("img").first()).toBeVisible();
    const productPosters = page.locator('[data-testid="product-video"][data-reduced-motion="true"] img');
    await expect(productPosters).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) await expect(productPosters.nth(index)).toBeVisible();
    const panels = page.locator("[data-step]");
    await expect(panels).toHaveCount(3);
    await expect.poll(() => panels.evaluateAll((items) => items.every((item) => getComputedStyle(item).position === "relative"))).toBe(true);
  });
});
