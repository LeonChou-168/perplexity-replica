# Perplexity Computer local replica

## 非官方项目 / 免责声明

本项目是 Perplexity Computer 产品页的本地、非商业视觉复刻，仅用于个人学习与技术研究。

- 本项目与 Perplexity AI 无任何关联，不是官方产品，也未获得其认可或赞助。
- MIT 许可证仅覆盖本项目自写的源代码。`public/assets/` 下的官方媒体素材以及 `reference/` 下的官方抓取产物版权归 Perplexity AI 所有，仅限本地非商业学习与视觉评测使用，不得再分发或用于商业用途。
- Perplexity 及相关名称、标志、商标与媒体素材的权利归其各自所有者。
- 本项目不实现 Computer 的任何实际服务，所有产品链接均指向官方站点。

This is an unofficial, non-commercial local visual replica of the Perplexity Computer product page, created for personal study and evaluation. It is not affiliated with, endorsed by, or sponsored by Perplexity AI. The MIT license covers this project's original source code only; official media under `public/assets/` and captured material under `reference/` remain the property of Perplexity AI and must not be redistributed or used commercially. See [NOTICE](NOTICE) for details.

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

## License

Original source code is released under the [MIT License](LICENSE). Official Perplexity AI media assets under `public/assets/` and captured reference material under `reference/` are not covered by that license; see [NOTICE](NOTICE) for the full scope.
