# Contributing

Thanks for helping improve AI Read-Time Indicator. Contributions should preserve the project's core guarantees: calculations stay local, and the extension does not collect or transmit chat content.

## Development setup

Requirements: Node.js 20+ and pnpm 9.

```sh
pnpm install
pnpm dev
```

Load the generated unpacked extension from `.output/chrome-mv3` in your browser. For Firefox use `pnpm dev:firefox` or `pnpm build:firefox`.

Before opening a PR:

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build:chrome
pnpm build:firefox
```

## Fixing a selector

Site DOM changes are expected. Selectors live in `src/selectors/selectors.json`; adapter behavior is in `src/adapters/registry.ts`.

1. Inspect the site's current DOM locally while signed in. Do not export real chat HTML or include private conversation data in an issue or PR.
2. Update only the selector data when possible. Keep selector fallbacks narrow and scoped to assistant messages.
3. Update the corresponding synthetic fixture in `tests/fixtures/` and add/update a regression test.
4. Verify assistant messages are detected and user messages are ignored.
5. Run all automated checks and manually smoke-test on the affected site.

## Adding a site adapter

1. Add a `SiteId` and settings default in `src/shared/defaultSettings.ts`.
2. Add the host and selectors to `src/adapters/registry.ts` and `src/selectors/selectors.json`.
3. Add the match pattern in `wxt.config.ts` and the content entrypoint, plus the site's popup toggle.
4. Add a synthetic HTML fixture and tests for assistant/user detection, text extraction, code, and generation state.
5. Update README, privacy/permission notes, and the QA matrix.

## Pull requests

Use a concise Conventional Commit-style title when practical (`fix:`, `feat:`, `docs:`). Do not include copied chat messages, screenshots, cookies, account details, or credentials. If a change adds a network request or permission, explain why and demonstrate that no page content is transmitted.
