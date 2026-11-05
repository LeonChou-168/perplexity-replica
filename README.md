# Perplexity Computer local replica

A local, non-commercial Vite + React + TypeScript recreation of the Perplexity Computer product page. The runtime is fully local: it does not execute the official application bundle, load analytics, or request remote media.

## Run locally

```sh
npm install
npm run dev
```

The site automatically selects Chinese for browser languages beginning with `zh`; all other languages use English.

## Verify

```sh
npm test
npm run build
npm run test:e2e
```

Use `?visualTest=1` to freeze automatic motion for deterministic screenshots. The fixture also accepts:

```text
locale=en|zh-CN
verbIndex=0..99
taskIndex=0..99
unifiesProgress=0..1
workflowStep=0..2
mediaTime=seconds
```

For example:

```text
/?visualTest=1&locale=en&verbIndex=2&taskIndex=5&unifiesProgress=.75&workflowStep=2&mediaTime=2.25
```

These controls are disabled in production builds. Browser media, fonts, icons, and posters are stored in `public/assets/`; provenance, dimensions, duration, byte length, source bundle, snapshot id, and SHA-256 values are recorded in `public/assets/manifest.json`. The Unifies scene uses local Three.js/WebGL with a deterministic Canvas 2D fallback.

## Reference status

`reference/official/computer-2026-07-26T23-48-58+08-00/` records the latest public-page probe. Current copy and primary media URLs were confirmed, but direct HTML/HAR, clean-browser DOM, computed-style, and current screenshot capture were blocked. The preserved 2026-07-23 official CSS and measured screenshots therefore remain the visual baseline; current-version pixel equality must not be inferred from a passing build.

## Usage

This replica is intended only for local, non-commercial visual evaluation. It does not implement Computer, authentication, forms, tracking, or data collection. Product links continue to the official Perplexity destinations.
