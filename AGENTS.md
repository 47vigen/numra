# AGENTS.md

Conventions for coding agents working **in this repository**.

> **Just want to *use* raqam in another project?** You don't need this file.
> Read [`skills/raqam/SKILL.md`](skills/raqam/SKILL.md), or point your agent at
> <https://raqam.47vigen.com/llms.txt> (index) or
> <https://raqam.47vigen.com/llms-full.txt> (every page, one file). The shipped
> `.d.ts` files carry JSDoc with runnable examples, so hovering `NumberField` in
> an editor is often enough.

## What this is

`raqam` — a headless React number input with live, cursor-stable formatting and
i18n digit support. Published to npm, MIT, **zero runtime dependencies**. React
18/19 are peer deps. pnpm 10.

Two different Node floors, don't conflate them: the **published package**
supports Node ≥20.9 (`engines.node`), while **developing on this repo** needs
Node 22+ — `jsdom@30`, the vitest environment, requires
`^22.22.2 || ^24.15.0 || >=26.0.0`. `.nvmrc` pins 22 and CI reads it.

## Layout

| Path | What lives there |
| --- | --- |
| `src/core/` | No React. Formatter, parser, cursor math, digit normalizer, presets. Ships as `raqam/core` and `raqam/server`. |
| `src/react/` | Hooks and the `NumberField` compound components. Ships as `raqam/react`. |
| `src/locales/` | Side-effect digit plugins (`fa`, `ar`, `bn`, `hi`, `th`). |
| `src/stories/` | Storybook, snapshotted by Chromatic. |
| `e2e/` | Playwright **component** tests — real browsers, for caret and RTL behaviour. |
| `docs/` | The Next.js + Fumadocs site. Separate workspace package, not published. |
| `skills/raqam/` | The installable agent skill. Keep in sync with the API. |
| `DEFINITION.md` | Historical design spec written *before* implementation. Rationale, not API docs — do not treat it as current. |

## Verifying your work

`pnpm lint` is **read-only** (`biome check src/`); `pnpm lint:fix` writes. Never
use a writing command as a gate.

```bash
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm lint        # biome check src/
pnpm build       # tsup — must succeed before publint/size
pnpm publint     # export map validity
pnpm size        # size-limit budgets, enforced in CI
pnpm test:e2e    # Playwright CT — needs `pnpm exec playwright install` once
```

`pnpm lint` currently reports ~34 warnings (exhaustive-deps on
deliberately mount-only memos, non-null assertions the surrounding code proves).
They are known and do not fail CI — don't "fix" them by changing behaviour.

## Rules that bite

- **TypeScript stays on 5.x.** 6.x and 7.x break the `.d.ts` build: tsup's
  `rollup-plugin-dts` reads the old compiler API and dies on
  `useCaseSensitiveFileNames`. Do not bump it, in either package.
- **Never add a runtime dependency.** Zero deps is a headline claim, a security
  boundary, and what keeps the core at ~2.2 KB.
- **Public API changes need a changeset** (`pnpm changeset`). Releases are
  automated from `main`; merging the "Version Packages" PR publishes to npm.
- **JSDoc on the public surface must sit on the exported object's properties**,
  not on the internal `const`. Declaration emit synthesizes the `NumberField`
  object type and drops docs attached to the individual components. That JSDoc
  is what an agent reads in a consumer's `node_modules` — treat it as shipped
  documentation, not comments.
- **Size budgets are enforced.** `.size-limit.json` fails CI on a regression.
- **Bundle-size figures appear in four places** — `README.md`,
  `docs/content/docs/index.mdx`, `docs/app/(home)/page.tsx`, and
  `docs/content/docs/guides/locales.mdx`. Update all of them together from
  `pnpm size` output.

## Branches and commits

Default branch `main`, never committed to directly. Branch as `claude/*`,
`fix/*`, `feat/*`, `docs/*`, `chore/*`, and open a PR.

Conventional Commits with a scope, enforced by commitlint:
`fix(core):`, `feat(react):`, `docs(readme):`, `chore(deps):`, `ci:`.

## Docs site

`pnpm docs:dev` runs it; `pnpm docs:build` builds it (the library is built
first by `docs/scripts/build-lib.mjs`). Machine-readable surfaces that must keep
working: `/llms.txt`, `/llms-full.txt`, `/api/md/*`, and `/opengraph-image`.

Page markdown comes from `page.data.getText("processed")`. The older
`page.data._markdown` field returns `undefined` in fumadocs-mdx 15 and fails
silently — it served title-only pages for a while.
