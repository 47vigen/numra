"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef } from "react";
import type { NumberFieldAria, NumberFieldState, UseNumberFieldProps } from "../core/types.js";
import { createFormatter } from "../core/formatter.js";
import { createParser } from "../core/parser.js";
import { computeNewCursorPosition } from "../core/cursor.js";
import { normalizeDigits } from "../core/normalizer.js";
import { usePressAndHold } from "./usePressAndHold.js";

// ── Tiny helper to safely escape regex special chars (including hyphen) ──────

function escapeRegex(s: string): string {
  // Escaping hyphen prevents it from being misinterpreted as a range indicator
  // inside a character class (e.g. [.--] would be invalid without this)
  return s.replace(/[.*+?^${}()|[\]\\\-]/g, "\\$&");
}

export function useNumberField(
  props: UseNumberFieldProps,
  state: NumberFieldState,
  inputRef: React.RefObject<HTMLInputElement | null>
): NumberFieldAria {
  const {
    locale,
    formatOptions,
    minValue,
    maxValue,
    allowNegative = true,
    allowDecimal = true,
    allowMouseWheel = false,
    liveFormat = true,
    prefix,
    suffix,
    name,
    disabled,
    readOnly,
    required,
    onFocus,
    onBlur,
    maximumFractionDigits,
    minimumFractionDigits,
    fixedDecimalScale,
    copyBehavior = "formatted",
    stepHoldDelay = 400,
    stepHoldInterval = 200,
  } = props;

  const {
    step = 1,
    largeStep = step * 10,
    smallStep = step * 0.1,
  } = state.options;

  const autoId = useId();
  const inputId = props.id ?? `numra-${autoId}`;
  const labelId = `${inputId}-label`;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  // ── Formatter & parser (kept in sync with state's) ──────────────────────
  const formatter = useMemo(
    () =>
      createFormatter({
        locale,
        formatOptions,
        prefix,
        suffix,
        minimumFractionDigits,
        maximumFractionDigits,
        fixedDecimalScale,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, JSON.stringify(formatOptions), prefix, suffix, minimumFractionDigits, maximumFractionDigits, fixedDecimalScale]
  );

  const parser = useMemo(
    () =>
      createParser({
        locale,
        formatOptions,
        allowNegative,
        allowDecimal,
        prefix,
        suffix,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, JSON.stringify(formatOptions), allowNegative, allowDecimal, prefix, suffix]
  );

  // ── Cursor engine ────────────────────────────────────────────────────────
  const pendingCursor = useRef<number | null>(null);

  // Restore cursor synchronously after React commits the new value to DOM
  useLayoutEffect(() => {
    if (
      pendingCursor.current !== null &&
      inputRef.current &&
      document.activeElement === inputRef.current
    ) {
      inputRef.current.setSelectionRange(
        pendingCursor.current,
        pendingCursor.current
      );
      pendingCursor.current = null;
    }
  // Run after every inputValue change
  }, [state.inputValue, inputRef]);

  // ── Mouse wheel (non-passive native listener) ────────────────────────────
  // React's synthetic onWheel is passive in React 17+; it cannot call
  // preventDefault(). We must attach a native, non-passive listener instead.
  useEffect(() => {
    const el = inputRef.current;
    if (!el || !allowMouseWheel) return;

    const handler = (e: WheelEvent) => {
      if (disabled || readOnly) return;
      if (document.activeElement !== el) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        state.increment();
      } else {
        state.decrement();
      }
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [allowMouseWheel, disabled, readOnly, state, inputRef]);

  // ── onChange handler ─────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const cursorPos = e.target.selectionStart ?? rawValue.length;
      const inputType = (e.nativeEvent as InputEvent).inputType;
      const info = formatter.getLocaleInfo();

      // Normalise non-Latin digits
      const normalized = normalizeDigits(rawValue);

      let displayValue: string;

      if (liveFormat) {
        const result = parser.parse(normalized);

        if (result.isIntermediate) {
          // Preserve intermediate states (lone "-", trailing "1.", etc.)
          displayValue = normalized;
        } else if (result.value !== null) {
          displayValue = formatter.format(result.value);
        } else if (normalized === "") {
          displayValue = "";
        } else {
          // Invalid input — keep the raw normalised string so the user can
          // see what they typed (they'll get corrected on blur)
          displayValue = normalized;
        }

        // Compute and stash cursor position for useLayoutEffect
        pendingCursor.current = computeNewCursorPosition(
          rawValue,
          cursorPos,
          displayValue,
          info,
          inputType
        );
      } else {
        // No live format — just pass through normalised digits
        displayValue = normalized;
        pendingCursor.current = cursorPos;
      }

      state.setInputValue(displayValue);
    },
    [formatter, parser, liveFormat, state]
  );

  // ── Paste handler ────────────────────────────────────────────────────────
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      if (!text) return;

      // 1. Strip common currency symbols (global currencies)
      const stripped = text
        .replace(/[€$£¥₹₺₽﷼฿₩¢₦₨₪₫₱]/g, "")
        .trim();

      // 2. Normalize non-Latin digits to ASCII
      const normalized = normalizeDigits(stripped);

      // 3. Try parse with current locale parser
      const result = parser.parse(normalized);

      if (result.value !== null) {
        const formatted = formatter.format(result.value);
        state.setInputValue(formatted);
        pendingCursor.current = formatted.length;
        return;
      }

      // 4. Fallback: strip everything except digits, locale decimal, minus sign
      const localeInfo = formatter.getLocaleInfo();
      const allowedCharsPattern = new RegExp(
        `[^0-9${escapeRegex(localeInfo.decimalSeparator)}${escapeRegex(localeInfo.minusSign)}-]`,
        "g"
      );
      const stripped2 = normalized.replace(allowedCharsPattern, "");
      const result2 = parser.parse(stripped2);

      if (result2.value !== null) {
        const formatted = formatter.format(result2.value);
        state.setInputValue(formatted);
        pendingCursor.current = formatted.length;
      }
      // If still invalid, silently discard — don't paste garbage into the field
    },
    [parser, formatter, state]
  );

  // ── Copy / Cut handlers ──────────────────────────────────────────────────
  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (copyBehavior === "formatted") return; // browser handles it natively

      e.preventDefault();
      const text = String(state.numberValue ?? "");
      e.clipboardData.setData("text/plain", text);
    },
    [copyBehavior, state.numberValue]
  );

  const handleCut = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (copyBehavior === "formatted") return; // browser handles it

      e.preventDefault();
      const text = String(state.numberValue ?? "");
      e.clipboardData.setData("text/plain", text);
      // Clear the field after cut
      state.setInputValue("");
    },
    [copyBehavior, state]
  );

  // ── Keyboard handler ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;

      const key = e.key;

      if (key === "ArrowUp" || key === "ArrowDown") {
        e.preventDefault();
        const direction = key === "ArrowUp" ? 1 : -1;
        if (e.shiftKey) {
          direction > 0 ? state.increment(largeStep) : state.decrement(largeStep);
        } else if (e.metaKey || e.ctrlKey) {
          direction > 0 ? state.increment(smallStep) : state.decrement(smallStep);
        } else {
          direction > 0 ? state.increment() : state.decrement();
        }
        return;
      }

      if (key === "PageUp") {
        e.preventDefault();
        state.increment(largeStep);
        return;
      }

      if (key === "PageDown") {
        e.preventDefault();
        state.decrement(largeStep);
        return;
      }

      if (key === "Home") {
        if (minValue !== undefined) {
          e.preventDefault();
          state.decrementToMin();
        }
        return;
      }

      if (key === "End") {
        if (maxValue !== undefined) {
          e.preventDefault();
          state.incrementToMax();
        }
        return;
      }

      if (key === "Enter") {
        state.commit();
        return;
      }
    },
    [disabled, readOnly, state, largeStep, smallStep, minValue, maxValue]
  );

  // ── Blur handler ─────────────────────────────────────────────────────────
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      state.commit();
      onBlur?.(e);
    },
    [state, onBlur]
  );

  // ── Press-and-hold for increment/decrement buttons ───────────────────────
  const incrementHold = usePressAndHold(() => state.increment(), {
    delay: stepHoldDelay,
    interval: stepHoldInterval,
    disabled: disabled || !state.canIncrement,
  });

  const decrementHold = usePressAndHold(() => state.decrement(), {
    delay: stepHoldDelay,
    interval: stepHoldInterval,
    disabled: disabled || !state.canDecrement,
  });

  // ── ARIA valuetext ───────────────────────────────────────────────────────
  const ariaValueText = useMemo(() => {
    if (state.numberValue == null) return undefined;
    return formatter.format(state.numberValue);
  }, [state.numberValue, formatter]);

  // ── RTL detection ────────────────────────────────────────────────────────
  const localeInfo = formatter.getLocaleInfo();

  // ── Out-of-range detection (for aria-invalid + data-invalid) ────────────
  const isOutOfRange =
    state.numberValue !== null &&
    ((minValue !== undefined && state.numberValue < minValue) ||
      (maxValue !== undefined && state.numberValue > maxValue));

  // ── Prop maps ────────────────────────────────────────────────────────────

  const labelProps: React.LabelHTMLAttributes<HTMLLabelElement> = {
    id: labelId,
    htmlFor: inputId,
  };

  const groupProps: React.HTMLAttributes<HTMLDivElement> = {
    role: "group",
    "aria-labelledby": props["aria-labelledby"] ?? labelId,
  };

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    id: inputId,
    type: "text",
    inputMode: "decimal",
    role: "spinbutton",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
    "aria-label": props["aria-label"],
    "aria-labelledby": props["aria-labelledby"] ?? labelId,
    "aria-describedby": props["aria-describedby"],
    "aria-valuenow": state.numberValue ?? undefined,
    "aria-valuemin": minValue,
    "aria-valuemax": maxValue,
    "aria-valuetext": ariaValueText,
    "aria-disabled": disabled || undefined,
    "aria-readonly": readOnly || undefined,
    "aria-required": required || undefined,
    "aria-invalid": isOutOfRange ? true : undefined,
    disabled,
    readOnly,
    required,
    value: state.inputValue,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    onFocus: onFocus as React.FocusEventHandler<HTMLInputElement>,
    onPaste: handlePaste,
    onCopy: copyBehavior !== "formatted" ? handleCopy : undefined,
    onCut: copyBehavior !== "formatted" ? handleCut : undefined,
    // RTL: numbers are always LTR, align-right in RTL contexts
    // unicodeBidi: embed isolates the LTR number from surrounding RTL text
    style: localeInfo.isRTL
      ? { direction: "ltr", textAlign: "right", unicodeBidi: "embed" }
      : undefined,
    // Data attributes for CSS styling
    "data-disabled": disabled ? "" : undefined,
    "data-readonly": readOnly ? "" : undefined,
    "data-required": required ? "" : undefined,
    "data-invalid": isOutOfRange ? "" : undefined,
  } as React.InputHTMLAttributes<HTMLInputElement>;

  const hiddenInputProps: React.InputHTMLAttributes<HTMLInputElement> | null =
    name
      ? {
          type: "hidden",
          name,
          value: state.numberValue ?? "",
          "aria-hidden": true,
        }
      : null;

  const incrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    type: "button",
    tabIndex: -1,
    "aria-label": "Increase",
    disabled: disabled || !state.canIncrement,
    // Press-and-hold handlers replace simple onClick
    ...incrementHold,
    "data-disabled": disabled || !state.canIncrement ? "" : undefined,
  } as React.ButtonHTMLAttributes<HTMLButtonElement>;

  const decrementButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    type: "button",
    tabIndex: -1,
    "aria-label": "Decrease",
    disabled: disabled || !state.canDecrement,
    // Press-and-hold handlers replace simple onClick
    ...decrementHold,
    "data-disabled": disabled || !state.canDecrement ? "" : undefined,
  } as React.ButtonHTMLAttributes<HTMLButtonElement>;

  const descriptionProps: React.HTMLAttributes<HTMLElement> = {
    id: descriptionId,
  };

  const errorMessageProps: React.HTMLAttributes<HTMLElement> = {
    id: errorId,
    role: "alert",
    "aria-live": "polite",
  } as React.HTMLAttributes<HTMLElement>;

  return {
    labelProps,
    groupProps,
    inputProps,
    hiddenInputProps,
    incrementButtonProps,
    decrementButtonProps,
    descriptionProps,
    errorMessageProps,
  };
}
