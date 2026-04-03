# Phase 4 Worklog: Locale Plugins & i18n

**Status:** ✅ COMPLETE  
**Branch:** `claude/phase-4-implementation-Uqhgc`  
**Date:** 2026-04-03  
**Tests:** 219 → 335 passing (116 new tests; 0 failures)

---

## What Phase 4 Required (from DEFINITION.md §12)

> - Persian (`fa`), Arabic (`ar`), Bengali (`bn`), Hindi (`hi`), Thai (`th`) locale plugins
> - RTL rendering logic
> - Integration tests with each locale
> - Playwright browser tests for cursor behavior in RTL

The locale plugins and RTL rendering logic existed from Phases 1–3. Phase 4's work was
purely **validation**: prove correctness through comprehensive tests and add browser-level
Playwright infrastructure.

---

## A. Locale Plugin Enhancements

### A1. `LOCALE_CODES` exports (fa.ts, ar.ts, hi.ts, bn.ts, th.ts)

Added a `LOCALE_CODES` readonly tuple to each locale plugin so consumers and tests can
programmatically discover which BCP 47 tags each plugin covers:

```typescript
// fa.ts
export const LOCALE_CODES = ["fa", "fa-IR", "fa-AF"] as const;

// ar.ts
export const LOCALE_CODES = ["ar", "ar-EG", "ar-SA", "ar-MA", "ar-DZ", "ar-TN"] as const;

// hi.ts
export const LOCALE_CODES = ["hi", "hi-IN", "mr", "mr-IN", "ne", "ne-NP"] as const;

// bn.ts
export const LOCALE_CODES = ["bn", "bn-BD", "bn-IN"] as const;

// th.ts
export const LOCALE_CODES = ["th", "th-TH"] as const;
```

**Why:** Enables IDE auto-complete, allows tests to use canonical locale lists, and
documents the intended coverage scope of each plugin.

### A2. Fixed `locales/index.ts` barrel export

The barrel used `export * from "./fa.js"` etc. After adding `LOCALE_CODES` to each
plugin, all five modules exported a symbol named `LOCALE_CODES`, causing TypeScript
error TS2308 (ambiguous re-export). Fixed by using aliased named re-exports:

```typescript
export { LOCALE_CODES as FA_LOCALE_CODES } from "./fa.js";
export { LOCALE_CODES as AR_LOCALE_CODES } from "./ar.js";
// ... etc.
```

Named re-exports still evaluate the entire source module, so `registerLocale()` calls
(the digit-block side effects) are triggered correctly.

---

## B. RTL Input Enhancement

### B1. `data-rtl` attribute (src/react/useNumberField.ts)

Added `"data-rtl": localeInfo.isRTL ? "" : undefined` to the input props alongside the
existing inline styles. This enables:
- Pure-CSS RTL-specific overrides: `[data-rtl] { border-color: blue; }`
- Easy DOM queries in E2E tests without inspecting computed styles
- Consistency with the existing `data-disabled`, `data-readonly`, `data-invalid` pattern

The inline styles (`direction: ltr; text-align: right; unicodeBidi: embed`) remain
unchanged — they're the functional layer, `data-rtl` is the styling hook.

---

## C. Locale Integration Tests (Vitest + React Testing Library)

### C1. `src/locales/test-utils.ts`

Shared helper module (not exported publicly) providing:
- `getLocaleInfo(locale)` — extracts separators/RTL flag from formatter
- `fmt(locale, value, opts?)` — format a number with given locale
- `parse(locale, input)` — parse a formatted string back to number
- `roundTrip(locale, value, opts?)` — verify format→parse identity
- `toLocaleDigits(locale, ascii)` — convert ASCII digits to locale script via Intl
- `localeUsesNativeDigits(locale)` — detect whether runtime ICU produces non-Latin digits

### C2. `src/locales/locale-integration.test.tsx` (61 tests)

Comprehensive test suite covering all spec requirements from DEFINITION.md §9:

| Group | Tests | Coverage |
|-------|-------|----------|
| LOCALE_CODES metadata | 5 | Each plugin's exported array |
| Separator extraction | 8 | Decimal/grouping for en-US, de-DE, fa-IR, ar-EG, he-IL, hi-IN, th-TH, bn-BD |
| Round-trip format/parse | 13 | 13 locale×value combinations |
| Lakh/crore grouping | 4 | hi-IN and bn-BD grouping patterns |
| Unicode digit normalization | 10 | All 5 scripts + ASCII pass-through + mixed |
| Parser: locale digit strings | 10 | Round-trip and raw digit string parsing |
| React component digit input | 7 | fa-IR, ar-EG, hi-IN, bn-BD, th-TH typed input → numberValue |
| Test utilities self-test | 2 | toLocaleDigits, localeUsesNativeDigits |
| localeUsesNativeDigits | 2 | en-US/de-DE = false, fa-IR/ar-EG = boolean without throw |

**Key decisions:**
- Locale plugins are imported as side-effects at the top of the test file (not in
  beforeAll) to ensure digit blocks are registered before any test runs.
- React component tests use `userEvent.type()` with raw Unicode digit codepoints to
  simulate what a native Persian/Arabic keyboard actually produces.
- Tests are tolerant of ICU availability: `localeUsesNativeDigits()` detects whether
  the Node.js runtime was built with full-icu; tests that need native digits use this
  to document the dependency rather than skip silently.

### C3. `src/react/rtl.test.tsx` (55 tests)

React-layer RTL rendering tests, covering the full CSS+ARIA+behavior surface:

| Group | Tests | Coverage |
|-------|-------|----------|
| RTL locales: BiDi styles | 24 | 6 RTL locales × 4 assertions each (direction, textAlign, unicodeBidi, data-rtl) |
| LTR locales: no RTL styles | 18 | 9 LTR locales × 2 assertions (no direction, no data-rtl) |
| aria-valuetext | 3 | fa-IR, ar-EG, en-US |
| role=spinbutton | 2 | fa-IR, ar-EG |
| Keyboard increment/decrement | 2 | ArrowUp in fa-IR, ArrowDown in ar-EG |
| Locale-switch rerenders | 2 | LTR→RTL and RTL→LTR |
| type/inputmode independence | 4 | All locales: type=text, inputmode=decimal |

**RTL locales tested:** `fa-IR`, `ar-EG`, `ar-SA`, `ar`, `he-IL`, `ur-PK`  
**LTR locales tested:** `en-US`, `de-DE`, `fr-FR`, `hi-IN`, `bn-BD`, `th-TH`, `zh-CN`, `ja-JP`, `ko-KR`

---

## D. Playwright Browser Tests

### D1. Installation

`@playwright/experimental-ct-react@1.59.1` and `@playwright/test@1.59.1` added as
devDependencies. Browser binaries not downloaded in this environment (no network access
to storage.googleapis.com); CI handles browser installation via
`npx playwright install --with-deps`.

### D2. `playwright-ct.config.ts`

Component Testing configuration:
- Uses `@playwright/experimental-ct-react` for in-browser React component rendering
  (no full dev server needed)
- Alias map points `numra/*` to `./src/*` for test imports
- Projects: Chromium, Firefox, WebKit
- `ctPort: 3100`, `retries: 2` in CI, `workers: 1` in CI, parallel otherwise
- Uploads HTML report as artifact on failure

### D3. `playwright/index.html` + `playwright/index.tsx`

Mount point for component tests. `index.tsx` pre-imports all 5 locale plugins so digit
normalization is available in every browser test without per-test imports.

### D4. `e2e/rtl-cursor.spec.tsx`

Cursor behavior tests that jsdom cannot simulate (real browser engine needed):

1. **en-US control group** (2 tests): comma insertion keeps cursor at end; Backspace
   after comma deletes the preceding digit.
2. **fa-IR cursor** (2 tests): cursor stays at end after grouping separator insertion;
   each digit press keeps cursor at end throughout typing sequence.
3. **fa-IR backspace** (1 test): backspace when cursor is right after separator deletes
   preceding digit; handles ICU-unavailability gracefully with `test.skip()`.
4. **ar-EG cursor** (2 tests): same guarantees as fa-IR.
5. **RTL attributes in browser** (3 tests): `data-rtl` present; computed direction is
   `ltr`; en-US has no `data-rtl`.
6. **Paste** (1 test): ASCII digit paste → cursor at end.

### D5. `e2e/locale-input.spec.tsx`

Locale and input correctness tests in real browsers:

1. **aria-valuenow** (5 tests): always a plain number, not locale-formatted string.
2. **ASCII digit input** (7 tests): every locale accepts ASCII '99' → value 99.
3. **Increment/decrement buttons** (4 tests): fa-IR, ar-EG, hi-IN with custom step.
4. **min/max clamping** (2 tests): fa-IR cannot go below min; ar-EG cannot go above max.
5. **Keyboard ArrowUp/Down** (3 tests): fa-IR, ar-EG, Shift+ArrowUp large step.
6. **Formatted display** (2 tests): en-US displays "1,234"; de-DE displays "1.234".

---

## E. CI Integration

### E1. `.github/workflows/e2e.yml`

Parallel matrix of Chromium, Firefox, WebKit. Each job:
1. Installs deps
2. Installs only the browser it needs (`npx playwright install --with-deps ${{ matrix.project }}`)
3. Runs `pnpm test:e2e --project=${{ matrix.project }}`
4. Uploads Playwright HTML report artifact on failure (retained 14 days)

### E2. `package.json` scripts

```json
"test:e2e": "playwright test -c playwright-ct.config.ts",
"test:e2e:ui": "playwright test -c playwright-ct.config.ts --ui",
"test:e2e:debug": "playwright test -c playwright-ct.config.ts --headed --project=chromium"
```

---

## Metrics

| Metric | Phase 3 | Phase 4 |
|--------|---------|---------|
| Vitest tests | 219 | **335** (+116) |
| TypeScript errors | 0 | **0** |
| Build warnings (new) | 0 | **0** |
| Locale plugins | 5 | **5** (+ LOCALE_CODES exports) |
| Playwright test files | 0 | **2** (browser, CI-ready) |
| CI workflows | 1 | **2** (+e2e.yml) |

---

## Known Limitations

- **Playwright browsers not downloaded locally** — `storage.googleapis.com` is
  unreachable in this environment. Browser tests are designed for CI. Run locally with
  `npx playwright install` after network is available.
- **ICU-dependent tests** — some test assertions depend on `Intl.NumberFormat` producing
  locale-native digits (e.g., `۱۲۳` for fa-IR). Node.js `small-icu` builds will produce
  ASCII digits for these locales; the `localeUsesNativeDigits()` helper documents this
  dependency. All test assertions that would fail without full-icu are either written to
  be ICU-agnostic (round-trip tests use `createFormatter` output as input to `createParser`)
  or use raw Unicode codepoints directly.
- **`"sideEffects": false` and locale/index** — the barrel export triggers module
  evaluation through named re-exports. Bundlers that perform aggressive dead-code
  elimination may still tree-shake locale registration if the `LOCALE_CODES` re-export
  is not imported. Consumers should import locale plugins individually
  (`import 'numra/locales/fa'`) when bundler configuration is uncertain.
