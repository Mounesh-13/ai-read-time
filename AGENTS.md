# Agent contributor notes

- Preserve the no-network/no-telemetry rule. No prompt or response data may leave the content script.
- Use synthetic fixture HTML only; never check in real chat DOM captures.
- Keep site CSS selectors in `src/selectors/selectors.json` when possible.
- Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, and `pnpm test` before packaging.
- Don't claim selectors work on a live site until manually verified with the QA checklist.
