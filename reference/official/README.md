# Official reference snapshot

This directory contains source material used only to compare the local replica
with the public Perplexity Computer page. Nothing here is loaded at runtime.

The raw official CSS and probe JSON captures referenced below are intentionally
untracked (see `.gitignore` and the repository `NOTICE`). They remain only in
local working copies for visual comparison and must not be redistributed.

The immutable `computer-2026-07-26T23-48-58+08-00/` probe confirms the current
public copy and primary asset URLs. Its status remains `partial`: direct HTML,
HAR, clean-browser DOM, computed-style, and screenshot capture were blocked, so
the 2026-07-23 CSS and measured geometry are still the visual baseline.

| File | Source | Retrieved | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| `style-ChJ3YH0S.css` | `https://pplx-marketing-static.perplexity.ai/assets/style-ChJ3YH0S.css` | 2026-07-23 | 825762 | `0853fc298f6644eae728e562fe409ad1a2e4f12f0575c5090fd391e6748bbcf6` |

The official application JavaScript is intentionally not executed by this
project. It includes authentication, experimentation, consent, attribution,
analytics, and monitoring integrations that are outside this local visual
replica.
