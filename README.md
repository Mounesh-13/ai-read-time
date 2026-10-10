# AI Read-Time Indicator

A free, open-source browser extension that estimates how long an AI assistant response takes to read. The estimate updates live while an answer streams, and everything is calculated locally in your browser — no servers, no tracking.

Supports **Claude** and **Gemini**. (ChatGPT support was removed: its interface no longer exposes stable markers for responses.)

## What it does

- Shows a small `⏱ ~2 min read` badge on assistant responses (`~40 sec read` for short ones).
- Counts prose words and code lines separately (defaults: 200 words/min, 30 code lines/min — both adjustable).
- Counts CJK text (Chinese/Japanese/Korean) by character instead of treating a whole paragraph as one word.
- Updates as a response streams, then stops observing finalized messages.
- Per-site toggles, reading-speed sliders, rounding, badge position, and light/dark theme.

## Privacy

**No chat content leaves the browser.** Message text is read locally only to compute the estimate. No telemetry, analytics, remote code, advertising, or backend. Preferences live in the browser's built-in extension sync storage. See [PRIVACY.md](PRIVACY.md).

The optional “Report a broken site” action opens a GitHub issue draft with the site name and browser version — no chat content. You review and submit it yourself.

## Install a development build

Requirements: Node.js 20+ and pnpm 9.

```sh
pnpm install
pnpm build:chrome
```

In Chrome, Edge, or Brave: open the extensions page, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3`. For hot reload, run `pnpm dev` and follow WXT's browser prompt.

Firefox:

```sh
pnpm build:firefox
```

Load it via `about:debugging` → **This Firefox** → **Load Temporary Add-on**, using the generated folder containing `manifest.json`.

## Development

```sh
pnpm install
pnpm dev             # Chrome
pnpm dev:firefox    # Firefox
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build:chrome
pnpm build:firefox
```

Selector snapshots live in `src/selectors/selectors.json`; the algorithm is in `src/core/calculator.ts`; fixtures in `tests/fixtures/`. See [CONTRIBUTING.md](CONTRIBUTING.md) — contributions are welcome, especially adapter fixes when Claude or Gemini change their markup.

Manually verified on the live Claude and Gemini interfaces (streaming, completed, and regenerated responses). See [TESTING.md](TESTING.md) for the checklist.

## Release

CI checks formatting, lint, type safety, unit tests, and Chrome/Firefox packaging on pushes and PRs. Pushing a tag like `v0.1.0` builds a GitHub Release with browser packages attached. See [PUBLISHING.md](PUBLISHING.md).

## Project status

MIT-licensed and free forever. Claude and Gemini don't expose stable DOM APIs, so selectors may need community fixes as their interfaces change — that's the most valuable contribution you can make.

## License

MIT — see [LICENSE](LICENSE).
