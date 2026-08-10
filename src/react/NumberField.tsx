"use client";

import React, { forwardRef, useMemo, useRef } from "react";
import type {
  NumberFieldRootProps,
  NumberFieldState,
  RenderProp,
  ScrubAreaCursorProps,
  ScrubAreaProps,
} from "../core/types.js";
import { NumberFieldContext, useNumberFieldContext } from "./context.js";
import { useNumberField } from "./useNumberField.js";
import { useNumberFieldState } from "./useNumberFieldState.js";
import { useScrubArea } from "./useScrubArea.js";

// ── Render prop utility ───────────────────────────────────────────────────────

/**
 * Merge component props with a `render` prop.
 * Accepts either a React element or a render function.
 *
 * `forwardedRef` is threaded through explicitly because React 18 keeps `ref`
 * out of `element.props`, so a render-prop element would otherwise lose refs the
 * default element depends on — e.g. the label-registration ref carried by
 * `labelProps`. When provided, it takes precedence over the render element's own
 * `ref`; callers that need to keep a consumer ref must compose it into
 * `forwardedRef` themselves (see `<NumberField.Label>`), where it can be
 * memoized for a stable identity.
 */
function renderWith(
  defaultElement: React.ReactElement,
  render: RenderProp | undefined,
  state: NumberFieldState,
  forwardedRef?: React.Ref<unknown>
): React.ReactElement {
  if (!render) return defaultElement;

  const baseProps = { ...(defaultElement.props as Record<string, unknown>) };
  if (forwardedRef != null) baseProps.ref = forwardedRef;

  if (typeof render === "function") {
    return render(baseProps, state);
  }

  // Element form: clone with merged props.
  const merged = Object.assign({}, baseProps, render.props as Record<string, unknown>);
  if (forwardedRef != null) merged.ref = forwardedRef;
  return React.cloneElement(render, merged);
}

// ── Ref helpers ───────────────────────────────────────────────────────────────

// React 19 exposes a React element's `ref` as a regular prop; React ≤18 stores
// it on the element itself (and reading `element.ref` on React 19 logs a
// deprecation warning), so branch on the version to read it without warnings.
// The same version boundary marks where callback refs may return a cleanup
// function: React 19 runs it on detach, React ≤18 ignores it (and warns).
const REF_IN_PROPS = Number.parseInt(React.version, 10) >= 19;
const SUPPORTS_REF_CLEANUP = REF_IN_PROPS;

function getElementRef(el: React.ReactElement): React.Ref<unknown> | undefined {
  if (REF_IN_PROPS) return (el.props as { ref?: React.Ref<unknown> }).ref;
  return (el as unknown as { ref?: React.Ref<unknown> }).ref;
}

/**
 * Compose multiple refs (callback or object) into one callback ref while
 * preserving each ref's cleanup. For every ref we capture a cleanup — a function
 * ref's returned cleanup, a synthesized `ref(null)` for legacy refs, or
 * `current = null` for object refs — so consumer cleanups aren't dropped on
 * unmount or ref change.
 *
 * The two React eras differ in HOW the combined cleanup gets back to React:
 * - React 19 runs a cleanup returned from a callback ref, so we return one.
 * - React ≤18 ignores (and warns about) a returned function and instead calls
 *   the ref with `null` on detach, so we stash the cleanups in a closure and run
 *   them on that `null` call rather than returning a function.
 */
function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  const attach = (node: T | null): (() => void)[] => {
    const cleanups: (() => void)[] = [];
    for (const ref of refs) {
      if (ref == null) continue;
      if (typeof ref === "function") {
        const result = ref(node);
        cleanups.push(typeof result === "function" ? result : () => ref(null));
      } else {
        (ref as React.MutableRefObject<T | null>).current = node;
        cleanups.push(() => {
          (ref as React.MutableRefObject<T | null>).current = null;
        });
      }
    }
    return cleanups;
  };

  if (SUPPORTS_REF_CLEANUP) {
    return (node) => {
      const cleanups = attach(node);
      return () => {
        for (const cleanup of cleanups) cleanup();
      };
    };
  }

  // React ≤18: drive cleanups off the `null` detach call instead of a return.
  let cleanups: (() => void)[] = [];
  return (node) => {
    for (const cleanup of cleanups) cleanup();
    cleanups = node == null ? [] : attach(node);
  };
}

// ── Data attributes helper ────────────────────────────────────────────────────

function stateDataAttrs(
  state: NumberFieldState,
  isInvalid: boolean
): Record<string, string | undefined> {
  const { options } = state;
  return {
    "data-disabled": options.disabled ? "" : undefined,
    "data-readonly": options.readOnly ? "" : undefined,
    "data-required": options.required ? "" : undefined,
    "data-scrubbing": state.isScrubbing ? "" : undefined,
    "data-focused": state.isFocused ? "" : undefined,
    "data-invalid": isInvalid ? "" : undefined,
  };
}

// ── Root ──────────────────────────────────────────────────────────────────────

// HTML attributes that belong on the wrapper div (not passed to state/aria hooks)
const DIV_ONLY_KEYS = new Set([
  "className",
  "style",
  "id",
  "tabIndex",
  "title",
  "role",
  "aria-label",
  "data-testid",
  "onClick",
  "onMouseEnter",
  "onMouseLeave",
]);

function splitProps(props: Record<string, unknown>) {
  const fieldProps: Record<string, unknown> = {};
  const divProps: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(props)) {
    if (DIV_ONLY_KEYS.has(key) || key.startsWith("data-") || key.startsWith("aria-")) {
      divProps[key] = val;
    } else {
      fieldProps[key] = val;
    }
  }
  return { fieldProps, divProps };
}

const Root = forwardRef<HTMLDivElement, NumberFieldRootProps>(function NumberFieldRoot(
  { children, onValueChange, onValueCommitted, ...allProps },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { fieldProps, divProps } = splitProps(allProps as Record<string, unknown>);
  const props = fieldProps as Omit<
    NumberFieldRootProps,
    "children" | "onValueChange" | "onValueCommitted"
  >;

  // Keep a stable ref to onValueChange so the onChange closure never goes stale
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  // Keep a stable ref to the state object so onChange can read the current reason
  const stateRef = useRef<NumberFieldState | null>(null);

  // Wrap onChange to also fire onValueChange with the tracked reason.
  // This closure captures stateRef (stable) not state (changes each render).
  // _setLastChangeReason is called synchronously BEFORE the state mutation
  // that triggers onChange, so stateRef.current._getLastChangeReason() always
  // returns the correct reason at the time onChange fires.
  const wrappedProps = {
    ...props,
    // Forward onValueCommitted to the behavior hook, which fires it on blur/Enter.
    onValueCommitted,
    onChange: (value: number | null) => {
      props.onChange?.(value);
      if (onValueChangeRef.current && stateRef.current) {
        onValueChangeRef.current(value, {
          reason: stateRef.current._getLastChangeReason(),
          // _getLatestDisplay (not .inputValue) — at onChange time `inputValue`
          // state still holds the previous render's value; the ref is updated
          // synchronously before the emission, so it matches `value`.
          formattedValue: stateRef.current._getLatestDisplay(),
        });
      }
    },
  };

  const state = useNumberFieldState(wrappedProps);
  stateRef.current = state; // always keep stateRef pointing to current state

  const aria = useNumberField(wrappedProps, state, inputRef);

  // Determine if field is invalid (out-of-range or failed validate)
  const isInvalid =
    state.validationState === "invalid" ||
    (state.numberValue !== null &&
      ((props.minValue !== undefined && state.numberValue < props.minValue) ||
        (props.maxValue !== undefined && state.numberValue > props.maxValue)));

  return (
    <NumberFieldContext.Provider value={{ state, aria, inputRef, props: wrappedProps }}>
      <div
        ref={ref}
        {...(divProps as React.HTMLAttributes<HTMLDivElement>)}
        {...stateDataAttrs(state, isInvalid)}
      >
        {children}
      </div>
    </NumberFieldContext.Provider>
  );
});

// ── Label ─────────────────────────────────────────────────────────────────────

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(function NumberFieldLabel(
  { render, children, ...rest },
  ref
) {
  const { aria, state } = useNumberFieldContext();
  // labelProps carries a registration ref; merge it with the forwarded ref and,
  // for the element render-prop form, the consumer's own ref on that element, so
  // all fire (the registration is what keeps Input/Group's aria-labelledby).
  // Memoized for a stable identity so React doesn't detach/reattach (and re-run
  // ref cleanups) every render — including across the hasLabel re-render.
  const { ref: labelRef, ...labelProps } = aria.labelProps;
  const renderRef = React.isValidElement(render) ? getElementRef(render) : undefined;
  const mergedRef = useMemo(() => mergeRefs(ref, labelRef, renderRef), [ref, labelRef, renderRef]);
  const el = (
    <label ref={mergedRef} {...labelProps} {...rest}>
      {children}
    </label>
  );
  return renderWith(el, render, state, mergedRef);
});

// ── Group ─────────────────────────────────────────────────────────────────────

interface GroupProps extends React.HTMLAttributes<HTMLDivElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Group = forwardRef<HTMLDivElement, GroupProps>(function NumberFieldGroup(
  { render, children, ...rest },
  ref
) {
  const { aria, state } = useNumberFieldContext();
  const el = (
    <div ref={ref} {...aria.groupProps} {...rest}>
      {children}
    </div>
  );
  return renderWith(el, render, state);
});

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  render?: RenderProp;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function NumberFieldInput(
  { render, ...rest },
  ref
) {
  const { aria, state, inputRef } = useNumberFieldContext();
  // The context ref drives caret control and scrubbing, so it must stay
  // attached — merge the consumer's ref alongside it rather than letting
  // either win. Memoized so React doesn't detach/reattach every render.
  const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref, inputRef]);
  // Merge a consumer aria-describedby (passed on <Input>) with the hook's
  // auto-wired value (the mounted <Description> id) instead of letting the
  // rest-spread clobber it — otherwise putting aria-describedby on the input
  // would silently drop the description association.
  const describedBy =
    [rest["aria-describedby"], aria.inputProps["aria-describedby"]].filter(Boolean).join(" ") ||
    undefined;
  const el = (
    <input ref={mergedRef} {...aria.inputProps} {...rest} aria-describedby={describedBy} />
  );
  return renderWith(el, render, state);
});

// ── Increment ─────────────────────────────────────────────────────────────────

interface IncrementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Increment = forwardRef<HTMLButtonElement, IncrementProps>(function NumberFieldIncrement(
  { render, children, ...rest },
  ref
) {
  const { aria, state } = useNumberFieldContext();
  const el = (
    <button ref={ref} {...aria.incrementButtonProps} {...rest}>
      {children ?? "+"}
    </button>
  );
  return renderWith(el, render, state);
});

// ── Decrement ─────────────────────────────────────────────────────────────────

interface DecrementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Decrement = forwardRef<HTMLButtonElement, DecrementProps>(function NumberFieldDecrement(
  { render, children, ...rest },
  ref
) {
  const { aria, state } = useNumberFieldContext();
  const el = (
    <button ref={ref} {...aria.decrementButtonProps} {...rest}>
      {children ?? "−"}
    </button>
  );
  return renderWith(el, render, state);
});

// ── HiddenInput ───────────────────────────────────────────────────────────────

const HiddenInput = function NumberFieldHiddenInput() {
  const { aria } = useNumberFieldContext();
  if (!aria.hiddenInputProps) return null;
  return <input {...aria.hiddenInputProps} />;
};

// ── ScrubArea ─────────────────────────────────────────────────────────────────

const ScrubArea = forwardRef<HTMLSpanElement, ScrubAreaProps>(function NumberFieldScrubArea(
  { render, children, direction = "horizontal", pixelSensitivity = 4, label, ...rest },
  ref
) {
  const { state } = useNumberFieldContext();
  const { scrubAreaProps } = useScrubArea(state, { direction, pixelSensitivity, label });

  const el = (
    <span ref={ref} {...scrubAreaProps} {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
      {children}
    </span>
  );
  return renderWith(el, render, state);
});

// ── ScrubAreaCursor ───────────────────────────────────────────────────────────
//
// Renders a custom cursor element positioned at the virtual cursor location
// during pointer lock. Use this to show a drag handle icon while scrubbing.
// Rendered only when isScrubbing is true.

const ScrubAreaCursor = forwardRef<HTMLSpanElement, ScrubAreaCursorProps>(
  function NumberFieldScrubAreaCursor({ render, children, style, ...rest }, ref) {
    const { state } = useNumberFieldContext();

    if (!state.isScrubbing) return null;

    const el = (
      <span
        ref={ref}
        style={{
          position: "fixed",
          pointerEvents: "none",
          zIndex: 9999,
          ...style,
        }}
        {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {children}
      </span>
    );
    return renderWith(el, render, state);
  }
);

// ── Description ───────────────────────────────────────────────────────────────

interface DescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

const Description = forwardRef<HTMLParagraphElement, DescriptionProps>(
  function NumberFieldDescription({ children, ...rest }, ref) {
    const { aria } = useNumberFieldContext();
    // descriptionProps carries a registration ref (like labelProps) so the input's
    // aria-describedby only points here while a Description is mounted. Merge it
    // with the forwarded ref so both fire.
    const { ref: descRef, ...descriptionProps } = aria.descriptionProps;
    const mergedRef = useMemo(() => mergeRefs(ref, descRef), [ref, descRef]);
    return (
      <p ref={mergedRef} {...descriptionProps} {...rest}>
        {children}
      </p>
    );
  }
);

// ── ErrorMessage ──────────────────────────────────────────────────────────────

interface ErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

const ErrorMessage = forwardRef<HTMLParagraphElement, ErrorMessageProps>(
  function NumberFieldErrorMessage({ children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    // If no children provided, fall back to the validation error string (if any)
    const content = children ?? state.validationError ?? null;
    if (!content) return null;
    return (
      <p ref={ref} {...aria.errorMessageProps} {...rest}>
        {content}
      </p>
    );
  }
);

// ── Formatted ─────────────────────────────────────────────────────────────────
//
// Read-only display of the current formatted value. Useful for showing the
// formatted number inline without an editable input (e.g., in a data table).

interface FormattedProps extends React.HTMLAttributes<HTMLSpanElement> {
  render?: RenderProp;
}

const Formatted = forwardRef<HTMLSpanElement, FormattedProps>(function NumberFieldFormatted(
  { render, style, ...rest },
  ref
) {
  const { state, aria } = useNumberFieldContext();
  // The input only sets `style` for RTL locales, so its presence flags RTL.
  const isRTL = aria.inputProps.style != null;
  // Isolate the number from surrounding bidi text (and mirror the input's RTL
  // alignment + data-rtl hook) so an inline formatted value renders correctly
  // next to RTL copy instead of inheriting the wrong direction.
  const mergedStyle: React.CSSProperties = isRTL
    ? { direction: "ltr", textAlign: "right", unicodeBidi: "plaintext", ...style }
    : { unicodeBidi: "isolate", ...style };
  const el = (
    <span
      ref={ref}
      aria-hidden="true"
      data-rtl={isRTL ? "" : undefined}
      style={mergedStyle}
      {...rest}
    >
      {state.inputValue}
    </span>
  );
  return renderWith(el, render, state);
});

// ── Namespace export ──────────────────────────────────────────────────────────

/**
 * Headless compound components for a live-formatting number input. This is the
 * recommended API; reach for {@link useNumberFieldState} + {@link useNumberField}
 * only when you need to own the DOM entirely.
 *
 * raqam ships **no styles** — bring Tailwind, CSS Modules, or a design system.
 * Every part forwards `className`, `style` and refs, except `HiddenInput`,
 * which takes no props at all.
 *
 * @example Quantity field
 * ```tsx
 * import { NumberField } from "raqam";
 *
 * <NumberField.Root locale="en-US" defaultValue={1} minValue={0} maxValue={99}>
 *   <NumberField.Label>Quantity</NumberField.Label>
 *   <NumberField.Group>
 *     <NumberField.Decrement>−</NumberField.Decrement>
 *     <NumberField.Input />
 *     <NumberField.Increment>+</NumberField.Increment>
 *   </NumberField.Group>
 * </NumberField.Root>
 * ```
 *
 * @example Currency, submitted by a native form
 * ```tsx
 * <NumberField.Root
 *   name="price"
 *   locale="en-US"
 *   formatOptions={{ style: "currency", currency: "USD" }}
 *   defaultValue={1234.56}
 *   minValue={0}
 * >
 *   <NumberField.Label>Price</NumberField.Label>
 *   <NumberField.Group>
 *     <NumberField.Input />
 *   </NumberField.Group>
 *   <NumberField.HiddenInput />
 * </NumberField.Root>
 * ```
 *
 * @example Persian digits — the locale plugin is a side-effect import
 * ```tsx
 * import { NumberField } from "raqam";
 * import "raqam/locales/fa";
 *
 * <NumberField.Root locale="fa-IR" defaultValue={250000}>…</NumberField.Root>
 * ```
 *
 * Rules that are easy to get wrong:
 * - Configure everything on `Root`. `Input` takes no `value`/`onChange`/`type`.
 * - Keep DOM order `Decrement, Input, Increment`; RTL flips them visually.
 * - Native `<form>` submission needs `name` on `Root` **and** a `HiddenInput`,
 *   because the visible input holds the formatted string.
 * - Locale plugins (`raqam/locales/fa|ar|bn|hi|th`) are only needed to *type*
 *   non-Latin digits; `locale` alone already formats them.
 *
 * @see https://raqam.47vigen.com/docs/api/components
 */
export const NumberField = {
  /**
   * Provider and outer `<div>`. Every other `NumberField.*` part must be nested
   * inside it — they read state from context and throw otherwise.
   *
   * Formatting options live here, not on `Input`: `locale`, `formatOptions`
   * (passed straight to `Intl.NumberFormat`), `minValue` / `maxValue`, `step`,
   * `defaultValue` (uncontrolled) or `value` + `onValueChange` (controlled).
   *
   * Exposes `data-disabled`, `data-invalid`, `data-focused` and `data-scrubbing`
   * for styling.
   */
  Root,
  /**
   * `<label>` wired to the input via `htmlFor` automatically — do not set your
   * own `htmlFor` or `id`. Omitting it leaves the field unlabelled; pass
   * `aria-label` on `Input` instead if the design has no visible label.
   */
  Label,
  /**
   * Optional `<div>` wrapping `Input` with the stepper buttons, carrying
   * `role="group"` and the field's `aria-labelledby`. Style the visual border
   * here — the input itself is unstyled and borderless by design.
   */
  Group,
  /**
   * The editable `<input role="spinbutton">`. Formats live as the user types
   * while keeping the caret in place, and accepts non-Latin digits when the
   * matching locale plugin is imported.
   *
   * `type` is fixed (`text` with `inputMode="decimal"`) — `type="number"` would
   * defeat formatting. Configure behaviour on `Root`, not here; `value`,
   * `onChange` and the keyboard model are supplied for you.
   */
  Input,
  /**
   * Stepper button that adds `step`. Press-and-hold repeats. Auto-disables at
   * `maxValue`. Supply the visible glyph as children (e.g. `+`); the accessible
   * name and `type="button"` are set for you.
   */
  Increment,
  /**
   * Stepper button that subtracts `step`. Press-and-hold repeats. Auto-disables
   * at `minValue`. In RTL locales it renders on the visual right automatically —
   * keep the DOM order Decrement, Input, Increment.
   */
  Decrement,
  /**
   * Hidden `<input>` carrying the raw number for native form submission — the
   * visible input holds the *formatted* string, so a plain `<form>` POST would
   * otherwise send `"$1,234.56"`. Requires `name` on `Root`. Renders nothing
   * without it. Not needed with react-hook-form, Formik, or any controlled setup.
   */
  HiddenInput,
  /**
   * Drag-to-change surface (the Figma-style scrub handle). Pointer-locks on
   * drag and steps the value by `pixelSensitivity` pixels per `step`. Wrap the
   * label or an icon in it. Pair with `ScrubAreaCursor` for a custom cursor.
   */
  ScrubArea,
  /**
   * Custom cursor rendered at the virtual pointer position while scrubbing, and
   * nothing otherwise. Must be nested inside `ScrubArea`.
   */
  ScrubAreaCursor,
  /**
   * Help text, linked to the input through `aria-describedby`. Use it instead of
   * a bare `<p>` so screen readers announce it with the field.
   */
  Description,
  /**
   * Validation message, linked via `aria-describedby` and carrying
   * `role="alert"`.
   *
   * With **no children** it renders the built-in range/validate message, and
   * nothing while the field is valid. With **children** you own visibility —
   * it renders them whenever they are truthy, so gate on
   * `state.validationState === "invalid"` yourself or you will leave a
   * permanent alert on screen.
   */
  ErrorMessage,
  /**
   * Read-only `<span>` mirroring the formatted display value, `aria-hidden` so
   * it is not announced twice. Handy for previews and RTL-safe inline text.
   */
  Formatted,
};
