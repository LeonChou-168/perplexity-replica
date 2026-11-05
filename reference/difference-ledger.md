# Fidelity difference ledger

Baseline: official CSS, public media, and measured screenshots captured on 2026-07-23, plus the public text and primary-media probe from 2026-07-26.

| Surface | Implemented evidence | Remaining difference or verification gap |
| --- | --- | --- |
| Header | 64px fixed state machine, scroll direction, light/dark state, desktop dropdowns, full-screen mobile menu, focus trap, `inert`, Escape, and focus restore | Current clean-browser computed styles and screenshots could not be recaptured |
| Hero | Official poster/video/audio, two-slot verb transition, three-card desktop cycle, 60s mobile marquee, building chrome, synchronized user-enabled audio, and media fallback | Current animation frames cannot be compared pixel-for-pixel without a fresh official recording |
| Intro | Interactive Computer wordmark, eye tracking, hover/focus tooltip, shake, shimmer, and click stamps | Motion parameters are reconstructed from the preserved CSS and prior recording rather than a current bundle capture |
| Unifies | `300dvh/-50dvh` scroll range, fixed media layers, scrubbed official WebM, word reveal, Dreamcloud, and front/back Three.js Helix with Canvas fallback | Official geometry, texture, and shader source was not present in the public asset set; the procedural Three.js scene is not claimed as an exact shader match |
| Workflow | Three independent sticky cards, official media geometry, active playback, custom controls, scrubber, poster fallback, lightbox, focus management, and reduced-motion normal flow | Exact current ScrollTrigger values cannot be remeasured until the official DOM is browser-accessible |
| Capabilities | Four original two-column rows, centered media CTA, reveal shimmer, 1.2s/1.05 hover, and single-column mobile layout | Current screenshot delta unavailable |
| Final CTA | Official background asset, documented height breakpoints, centered tablet/mobile copy, and official destination | Current screenshot delta unavailable |
| Footer | Official black sitemap structure, app badges, brand mark, copyright, and responsive columns | The current public extraction exposes six unlabeled icon slots, but their raw DOM, destinations, and SVG assets were not recoverable; the social-icon group is not reconstructed |
| Cookie | Local-only dialog, accept/reject dismissal, and versioned local storage | No tracking, consent platform, or third-party code is executed by design |

No row with an unavailable current screenshot is considered pixel-certified. The automated suite verifies structure, state, assets, localization, keyboard behavior, reduced motion, and local-only runtime requests; it does not provide an official screenshot regression baseline.

## Local browser QA (2026-07-27)

- Verified live at `1440x900`, `1280x720`, `768x1024`, and `390x844` in the Codex in-app Chrome runtime.
- Confirmed desktop dropdowns, mobile menu focus containment and Escape restore, deterministic Hero/Unifies/Workflow fixtures, Hero audio enable/disable, Workflow lightbox focus restore, WebGL Helix rendering, and local-only runtime media.
- Confirmed `scrollWidth === clientWidth` at all four breakpoints after restoring mobile Hero clipping; the `390px` viewport previously exposed a `795px` document width.
- Console inspection found no warning or error entries. Unit tests (`54/54`), TypeScript, and the production build pass.
- The standalone Playwright matrix is defined as 72 tests and was executed, but the local process sandbox aborts system Chrome before page creation (`SIGABRT`, Crashpad/Mach permission denial). A single-worker and headed probe fail at the same browser-launch boundary; those failures are not treated as page assertion results.

The unavailable current official screenshots still prevent certification of the requested `0.75%/1.25%` pixel thresholds. Local browser screenshots and structural checks do not replace a frozen same-date official baseline.
