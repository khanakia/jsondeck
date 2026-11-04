# Contributing to jsondeck

Thanks for helping. Bug reports, small fixes, docs and examples are all welcome. For a larger change, please open an issue first so we can agree on the shape before you spend time on it.

## Setup

```sh
git clone https://github.com/khanakia/jsondeck.git
cd jsondeck
pnpm install
pnpm build
```

Open `demo/index.html`, `demo/examples.html` or `docs/index.html` in a browser, from disk or through `node scripts/serve.mjs` (http://127.0.0.1:4173).

## Before you open a pull request

- `pnpm typecheck` passes. The code is strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`): no `any`, no non-null `!`, no casts and no `@ts-ignore`.
- `task verify` (or `scripts/verify-all.sh`) passes. It runs every headless browser check over http and `file://`, including the row-height, scrollbar and no-shadow audits.
- New behavior has a check in the matching `scripts/verify*.mjs` suite, and config changes have a sensible default so zero config keeps working.
- User-visible changes get a line under `## [Unreleased]` in `CHANGELOG.md`.

## Project rules

- Works from `file://`: no fetch for embedded data, no dynamic imports, no network calls.
- Zero config must work; every config option has a default.
- Compact UI: about 13px text, 28px table rows, light and dark themes, real pagination.
- Pure logic (`src/core/`) has no React in it; components take props and send events.
- Extension points (column renderers, chart types, saved-view storage) are interfaces with our version as the default.
- The table engine is our own; please do not add a table library.

## Commit messages

Short and plain, in the present tense: `table: keep the sort when a filter changes`.

## Releases

Releases are made by the maintainer with `task release` (see "How to release" in the README). Versions only go up by one patch number at a time.

## Code of Conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
