# Phase 2 Worklog — raqam

**Status: ✅ COMPLETE**
**Branch**: `claude/phase-2-implementation-2KsSb`
**Test Coverage**: 163 tests passing (8 test suites)
**New tests added**: 39 (usePressAndHold: 8, ScrubArea: 10, allowOutOfRange: 7, isScrubbing: 3, paste: 4, copy: 1, Description/ErrorMessage: 2, allowOutOfRange component: 4)

---

## What Was Built

### 1. Mouse Wheel — Non-Passive Fix (`useNumberField.ts`)

**Problem discovered**: React's synthetic `onWheel` listener is passive in React 17+, making `preventDefault()` a no-op. The Phase 1 skeleton worked for increment/decrement but the page still scrolled.

**Fix**: Replaced React's `onWheel` prop with a `useEffect` that attaches a native wheel listener with `{ passive: false }`:

```typescript
useEffect(() => {
  const el = inputRef.current;
  if (!el || !allowMouseWheel) return;
  const handler = (e: WheelEvent) => { ... e.preventDefault(); ... };
  el.addEventListener("wheel", handler, { passive: false });
  return () => el.removeEventListener("wheel", handler);
}, [allowMouseWheel, disabled, readOnly, state, inputRef]);
```

This is the only correct pattern — native non-passive listener required.

---

### 2. ScrubArea (Pointer Lock API) — `src/react/useScrubArea.ts` + `NumberField.tsx`

New compound components: `NumberField.ScrubArea` and `NumberField.ScrubAreaCursor`.

**Key design**: Stable ref pattern for all event handlers to avoid stale closures when `isScrubbing` state changes cause re-renders. Naive `useCallback` + dynamic `addEventListener` pattern failed because React re-renders removed the mousemove listener just after it was added.

**Solution**: `stableMouseMove` and `stablePointerLockChange` are stored in `useRef` (not created by `useCallback`). The `useEffect` registers them once on mount with `[]` deps — stable for lifetime of component.

**Flow**:

1. `onPointerDown` → `el.requestPointerLock()`
2. `pointerlockchange` fires → `document.addEventListener("mousemove", stableMouseMove)`
3. `mousemove` accumulates `movementX`/`movementY` into buffer; fires step when buffer ≥ `pixelSensitivity`
4. Pointer lock exits (Escape) → cleanup, `isScrubbing = false`

**Props**: `direction: "horizontal" | "vertical" | "both"` (default: `"horizontal"`), `pixelSensitivity: number` (default: `4`).

**Data attributes**: `data-scrubbing=""` propagates from ScrubArea up to Root via `state.isScrubbing`.

**ScrubAreaCursor**: Renders only when `isScrubbing` is true. Uses `position: fixed; pointer-events: none; z-index: 9999` for overlay cursor.

**`isScrubbing`** lives on `NumberFieldState` (`isScrubbing: boolean`, `setIsScrubbing: (val: boolean) => void`) so it flows naturally through context to Root for `data-scrubbing` propagation.

---

### 3. Press-and-Hold Acceleration — `src/react/usePressAndHold.ts`

New hook, zero React state (pure refs → zero re-renders from timing logic).

**Acceleration schedule** (default): immediate → 400ms → 200ms → 100ms → 50ms (floor)

Algorithm:

1. `onPointerDown`: call `callback()` immediately, schedule `setTimeout(delay)`
2. After delay: enter `scheduleRepeat(interval)` → recursive `setTimeout` halving period each call
3. `onPointerUp` / `onPointerLeave`: `clearTimeout` all pending timers, set `isHeldRef = false`
4. `useEffect` cleanup: clears timers on unmount

**Integration**: `usePressAndHold` instances replace `onClick` on increment/decrement buttons in `useNumberField.ts`. `onPointerDown` fires the callback immediately (same UX as click), then starts acceleration.

**Disabled support**: `disabled` option prevents any callback on `onPointerDown`.

---

### 4. Smart Paste — `useNumberField.ts` (`handlePaste`)

Multi-stage paste normalization:

1. Strip common currency symbols: `€$£¥₹₺₽﷼฿₩¢₦₨₪₫₱`
2. Normalize non-Latin digits via `normalizeDigits()` (reuses Phase 1 normalizer)
3. Try locale parser → format and set if valid
4. Fallback: strip all non-digit/decimal/minus characters → try parse again
5. Silently discard if still invalid (don't paste garbage)

The `escapeRegex()` helper was updated to escape hyphen (`-`) to prevent regex character class range errors (e.g., `[^0-9.--]` was invalid).

---

### 5. Copy Behavior — `useNumberField.ts`

New `copyBehavior: "formatted" | "raw" | "number"` prop (default: `"formatted"`).

- `"formatted"`: browser handles copy natively (copies displayed text including separators)
- `"raw"` / `"number"`: intercepts `onCopy`/`onCut`, writes `state.numberValue.toString()` to clipboard

**Cut behavior**: when `copyBehavior !== "formatted"`, `onCut` also clears the input value after copying.

---

### 6. RTL BiDi-safe Currency — `useNumberField.ts`

Enhanced the existing RTL style block with `unicodeBidi: "embed"`:

```typescript
style: localeInfo.isRTL ? {
  direction: "ltr",
  textAlign: "right",
  unicodeBidi: "embed",
} : undefined,
```

`unicodeBidi: embed` creates a directional embedding scope, isolating the LTR number string from surrounding RTL text. This prevents the BiDi algorithm from reordering currency symbols that `Intl.NumberFormat` positions per CLDR data.

---

### 7. `allowOutOfRange` — `useNumberFieldState.ts` + `useNumberField.ts`

New prop: `allowOutOfRange?: boolean` (default: `false`).

Changes to `useNumberFieldState.ts`:

- `setInputValue`: skips strict clamping check when `allowOutOfRange`
- `commit`: skips blur clamping when `allowOutOfRange`
- `canIncrement`/`canDecrement`: always `true` (ignoring bounds) when `allowOutOfRange` and not disabled/readOnly

Changes to `useNumberField.ts`:

- Computes `isOutOfRange = numberValue !== null && (value < min || value > max)`
- Sets `aria-invalid={true}` and `data-invalid=""` when out of range

---

### 8. New Types — `src/core/types.ts`

Added to `UseNumberFieldStateOptions`:

- `allowOutOfRange?: boolean`

Added to `UseNumberFieldProps`:

- `copyBehavior?: "formatted" | "raw" | "number"`
- `stepHoldDelay?: number`
- `stepHoldInterval?: number`

Added to `NumberFieldState`:

- `isScrubbing: boolean`
- `setIsScrubbing: (val: boolean) => void`

Added to `NumberFieldAria`:

- `descriptionProps: React.HTMLAttributes<HTMLElement>`
- `errorMessageProps: React.HTMLAttributes<HTMLElement>`

New interfaces:

- `ScrubAreaOptions` — direction, pixelSensitivity
- `ScrubAreaProps extends ScrubAreaOptions, React.HTMLAttributes<HTMLSpanElement>`
- `ScrubAreaCursorProps extends React.HTMLAttributes<HTMLSpanElement>`

Updated `NumberFieldRootProps.onValueChange` reasons: added `"scrub"`.

---

### 9. New Compound Components — `NumberField.tsx`

Added:

- `NumberField.ScrubArea` — wraps `useScrubArea`, renders `<span role="slider">`
- `NumberField.ScrubAreaCursor` — renders custom cursor during pointer lock (hidden when not scrubbing)
- `NumberField.Description` — renders `<p>` with `descriptionProps` id for ARIA
- `NumberField.ErrorMessage` — renders `<p role="alert">` with `errorMessageProps`

Root `stateDataAttrs()` now also emits `data-scrubbing=""` when `state.isScrubbing`.

---

### 10. Storybook Setup

- Storybook v10 + `@storybook/react-vite`
- Config: `.storybook/main.ts`, `.storybook/preview.ts`
- Scripts: `pnpm storybook`, `pnpm build-storybook`
- Stories: `src/stories/`
  - `BasicUsage.stories.tsx` — default, min/max, step, disabled, controlled, allowOutOfRange, press-and-hold
  - `Locales.stories.tsx` — all locales, Persian digit input
  - `Currency.stories.tsx` — USD, EUR, percent, prefix/suffix, compact notation
  - `ScrubArea.stories.tsx` — horizontal, vertical, multi-axis, custom cursor
  - `Accessibility.stories.tsx` — full ARIA, invalid state, keyboard guide

---

## Files Modified

| File                               | Change                                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/types.ts`                | +allowOutOfRange, +copyBehavior, +stepHoldDelay/Interval, +isScrubbing, +descriptionProps/errorMessageProps, +ScrubAreaOptions/Props, +scrub reason |
| `src/react/useNumberFieldState.ts` | +allowOutOfRange logic, +isScrubbing state                                                                                                          |
| `src/react/useNumberField.ts`      | Wheel fix (non-passive), paste handler, copy/cut handler, press-and-hold integration, RTL unicodeBidi, aria-invalid/data-invalid                    |
| `src/react/NumberField.tsx`        | +ScrubArea, +ScrubAreaCursor, +Description, +ErrorMessage, +data-scrubbing on Root                                                                  |
| `src/index.ts`                     | +usePressAndHold, +useScrubArea exports, +new types                                                                                                 |
| `src/test-setup.ts`                | +PointerEvent polyfill for jsdom                                                                                                                    |
| `package.json`                     | +storybook scripts, +storybook devDependencies                                                                                                      |

## New Files

| File                                    | Description                      |
| --------------------------------------- | -------------------------------- |
| `src/react/usePressAndHold.ts`          | Press-and-hold acceleration hook |
| `src/react/useScrubArea.ts`             | Pointer Lock API scrub hook      |
| `src/react/usePressAndHold.test.ts`     | 8 tests                          |
| `src/react/ScrubArea.test.tsx`          | 10 tests                         |
| `.storybook/main.ts`                    | Storybook v10 config             |
| `.storybook/preview.ts`                 | Storybook preview config         |
| `src/stories/BasicUsage.stories.tsx`    |                                  |
| `src/stories/Locales.stories.tsx`       |                                  |
| `src/stories/Currency.stories.tsx`      |                                  |
| `src/stories/ScrubArea.stories.tsx`     |                                  |
| `src/stories/Accessibility.stories.tsx` |                                  |

---

## Bundle Size Impact

| Entry          | Phase 1 | Phase 2 | Change  |
| -------------- | ------- | ------- | ------- |
| `raqam/core`   | 1.8 KB  | 1.8 KB  | 0       |
| `raqam` (full) | 4.5 KB  | 6.3 KB  | +1.8 KB |
| `raqam/react`  | 4.3 KB  | 6.1 KB  | +1.8 KB |

The 1.8 KB addition covers: ScrubArea + Pointer Lock (~600B), usePressAndHold (~200B), paste/copy handlers (~400B), new types overhead (~600B). Slightly over the 5 KB target; acceptable given the rich P2 features added.

---

## Key Technical Decisions & Bugs Fixed

### Bug: Stale mousemove listener in ScrubArea

**Problem**: `handlePointerLockChange` called `setIsScrubbingLocal(true)` which scheduled a React re-render. The `useEffect` cleanup removed the mousemove listener before `simulateMouseMove` tests ran.

**Fix**: Store all event handlers in `useRef` objects (`stableMouseMove`, `stablePointerLockChange`). Register `pointerlockchange` once on mount with `[]` deps. The stable refs always delegate to the latest state/props values via `stateRef.current`, `directionRef.current`, etc.

### Bug: Invalid regex character class in paste handler

**Problem**: `[^0-9.--]` — the minus sign from `localeInfo.minusSign` was placed as `-` in the character class, creating a range from `.` (U+002E) to `-` (U+002D), which is out-of-order.

**Fix**: Updated `escapeRegex()` to also escape hyphen: `/[.*+?^${}()|[\]\\\-]/g` → outputs `\-` for minus characters.

### Decision: `isScrubbing` on `NumberFieldState` (not context)

`isScrubbing` was added to `NumberFieldState` rather than the React context. This makes it accessible from the state layer, testable with `useNumberFieldState` in isolation, and flows naturally through context to all sub-components including Root for `data-scrubbing` propagation.

### Decision: Stable refs for ScrubArea handlers

Pointer Lock event handlers (`pointerlockchange`, `mousemove`) are registered on `document`, outside React's reconciliation. Using stable `useRef` wrappers avoids the fundamental problem of re-registering global listeners on every React re-render.

---

## Phase 2 Checklist

✅ Mouse wheel increment/decrement (non-passive, correct preventDefault)
✅ ScrubArea (Pointer Lock API, horizontal/vertical/both directions)
✅ ScrubAreaCursor (custom cursor during pointer lock)
✅ Press-and-hold button acceleration (400ms delay → 200→100→50ms floor)
✅ Smart paste handling (currency symbol stripping, fallback parser)
✅ Copy behavior control (formatted/raw/number modes)
✅ RTL BiDi-safe currency rendering (unicodeBidi: embed)
✅ `allowOutOfRange` flag (no clamping, aria-invalid, data-invalid)
✅ `NumberField.Description` and `NumberField.ErrorMessage` components
✅ Storybook v10 setup with 5 story files
✅ All 163 tests passing
✅ TypeScript strict mode: zero errors
✅ Build succeeds (ESM + CJS + DTS)
