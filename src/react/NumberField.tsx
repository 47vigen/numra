"use client";

import React, { forwardRef, useRef } from "react";
import type {
  NumberFieldRootProps,
  NumberFieldState,
  RenderProp,
  ScrubAreaProps,
  ScrubAreaCursorProps,
} from "../core/types.js";
import { NumberFieldContext, useNumberFieldContext } from "./context.js";
import { useNumberFieldState } from "./useNumberFieldState.js";
import { useNumberField } from "./useNumberField.js";
import { useScrubArea } from "./useScrubArea.js";

// ── Render prop utility ───────────────────────────────────────────────────────

/**
 * Merge component props with a `render` prop.
 * Accepts either a React element or a render function.
 */
function renderWith(
  defaultElement: React.ReactElement,
  render: RenderProp | undefined,
  state: NumberFieldState
): React.ReactElement {
  if (!render) return defaultElement;

  if (typeof render === "function") {
    return render(defaultElement.props as Record<string, unknown>, state);
  }

  // Element form: clone with merged props
  return React.cloneElement(render, Object.assign(
    {},
    defaultElement.props as Record<string, unknown>,
    render.props as Record<string, unknown>
  ));
}

// ── Data attributes helper ────────────────────────────────────────────────────

function stateDataAttrs(state: NumberFieldState): Record<string, string | undefined> {
  const { options } = state;
  return {
    "data-disabled": options.disabled ? "" : undefined,
    "data-readonly": options.readOnly ? "" : undefined,
    "data-required": options.required ? "" : undefined,
    "data-scrubbing": state.isScrubbing ? "" : undefined,
  };
}

// ── Root ──────────────────────────────────────────────────────────────────────

const Root = forwardRef<HTMLDivElement, NumberFieldRootProps>(
  function NumberFieldRoot({ children, onValueChange, onValueCommitted, ...props }, ref) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Wrap onChange to also fire onValueChange with details
    const wrappedProps = {
      ...props,
      onChange: (value: number | null) => {
        props.onChange?.(value);
        onValueChange?.(value, {
          reason: "input",
          formattedValue: "",
        });
      },
    };

    const state = useNumberFieldState(wrappedProps);
    const aria = useNumberField(wrappedProps, state, inputRef);

    return (
      <NumberFieldContext.Provider value={{ state, aria, inputRef, props: wrappedProps }}>
        <div ref={ref} {...stateDataAttrs(state)}>
          {children}
        </div>
      </NumberFieldContext.Provider>
    );
  }
);

// ── Label ─────────────────────────────────────────────────────────────────────

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  function NumberFieldLabel({ render, children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    const el = (
      <label ref={ref} {...aria.labelProps} {...rest}>
        {children}
      </label>
    );
    return renderWith(el, render, state);
  }
);

// ── Group ─────────────────────────────────────────────────────────────────────

interface GroupProps extends React.HTMLAttributes<HTMLDivElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Group = forwardRef<HTMLDivElement, GroupProps>(
  function NumberFieldGroup({ render, children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    const el = (
      <div ref={ref} {...aria.groupProps} {...rest}>
        {children}
      </div>
    );
    return renderWith(el, render, state);
  }
);

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  render?: RenderProp;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  function NumberFieldInput({ render, ...rest }, _ref) {
    const { aria, state, inputRef } = useNumberFieldContext();
    const el = (
      <input ref={inputRef} {...aria.inputProps} {...rest} />
    );
    return renderWith(el, render, state);
  }
);

// ── Increment ─────────────────────────────────────────────────────────────────

interface IncrementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Increment = forwardRef<HTMLButtonElement, IncrementProps>(
  function NumberFieldIncrement({ render, children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    const el = (
      <button ref={ref} {...aria.incrementButtonProps} {...rest}>
        {children ?? "+"}
      </button>
    );
    return renderWith(el, render, state);
  }
);

// ── Decrement ─────────────────────────────────────────────────────────────────

interface DecrementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: RenderProp;
  children?: React.ReactNode;
}

const Decrement = forwardRef<HTMLButtonElement, DecrementProps>(
  function NumberFieldDecrement({ render, children, ...rest }, ref) {
    const { aria, state } = useNumberFieldContext();
    const el = (
      <button ref={ref} {...aria.decrementButtonProps} {...rest}>
        {children ?? "−"}
      </button>
    );
    return renderWith(el, render, state);
  }
);

// ── HiddenInput ───────────────────────────────────────────────────────────────

const HiddenInput = function NumberFieldHiddenInput() {
  const { aria } = useNumberFieldContext();
  if (!aria.hiddenInputProps) return null;
  return <input {...aria.hiddenInputProps} />;
};

// ── ScrubArea ─────────────────────────────────────────────────────────────────

const ScrubArea = forwardRef<HTMLSpanElement, ScrubAreaProps>(
  function NumberFieldScrubArea(
    { render, children, direction = "horizontal", pixelSensitivity = 4, ...rest },
    ref
  ) {
    const { state } = useNumberFieldContext();
    const { scrubAreaProps } = useScrubArea(state, { direction, pixelSensitivity });

    const el = (
      <span
        ref={ref}
        {...scrubAreaProps}
        {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {children}
      </span>
    );
    return renderWith(el, render, state);
  }
);

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
    return (
      <p ref={ref} {...aria.descriptionProps} {...rest}>
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
    const { aria } = useNumberFieldContext();
    return (
      <p ref={ref} {...aria.errorMessageProps} {...rest}>
        {children}
      </p>
    );
  }
);

// ── Namespace export ──────────────────────────────────────────────────────────

export const NumberField = {
  Root,
  Label,
  Group,
  Input,
  Increment,
  Decrement,
  HiddenInput,
  ScrubArea,
  ScrubAreaCursor,
  Description,
  ErrorMessage,
};
