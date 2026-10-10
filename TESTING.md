# QA checklist

Run automated checks first:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build:chrome
pnpm build:firefox
```

Then load the unpacked build from `.output/chrome-mv3` (Chrome/Edge/Brave) or `.output/firefox-mv2` / `.output/firefox-mv3` as emitted by the installed WXT version. Verify on signed-in test accounts only; never record or share private conversation content.

## Manual matrix

- [ ] Short prose response: badge appears and shows `< 1 min read`.
- [ ] Medium and long prose: estimate uses the configured WPM and rounds as selected.
- [ ] Code-heavy response: code lines contribute to the estimate; nested `<pre><code>` is counted once.
- [ ] Streaming response: badge begins as `…`, grows while text streams, then settles after generation finishes.
- [ ] Interrupted response and regenerate: changed content updates the badge.
- [ ] Scroll a long conversation: off-screen messages are calculated when they approach the viewport.
- [ ] Navigate between conversations without reloading: old badges are removed and the new conversation is observed.
- [ ] Toggle global and per-site settings in the popup; changes apply to already-open tabs.
- [ ] Change WPM, code speed, rounding, position, and theme in options.
- [ ] Test both light and dark site appearance, reduced-motion preference, and narrow viewport.
- [ ] Inspect Network in DevTools: the extension makes no network requests with page content.

## Site selectors

The site DOM is not a stable public API. The bundled selector snapshots are starting points and must be verified against each site's current signed-in UI before calling a release production-ready. Keep fixtures synthetic and free of real conversation data.
