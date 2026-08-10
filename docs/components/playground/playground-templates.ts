import pkg from "raqam/package.json";

/**
 * Pinned to the workspace `raqam` version — the source of truth for releases.
 * Sandpack installs this exact version from npm, so it must be a published version.
 */
export const RAQAM_VERSION: string = pkg.version;

export type PlaygroundTemplateId = "starter" | "currency" | "persian";

export const PLAYGROUND_TEMPLATE_META: {
  id: PlaygroundTemplateId;
  label: string;
}[] = [
  { id: "starter", label: "Starter (quantity)" },
  { id: "currency", label: "Currency (USD)" },
  { id: "persian", label: "Persian (fa-IR)" },
];

const PALETTE = {
  light: {
    bg: "#ffffff",
    fg: "#18181b",
    muted: "#52525b",
    border: "#d4d4d8",
    surface: "#f4f4f5",
  },
  dark: {
    bg: "#0a0a0a",
    fg: "#fafafa",
    muted: "#a1a1aa",
    border: "#3f3f46",
    surface: "#27272a",
  },
} as const;

/**
 * Shared across every template so the App code stays about raqam, not CSS.
 * Themed from the docs site rather than `prefers-color-scheme`: the sandbox
 * iframe follows the OS, which would leave a white panel on a dark page.
 */
export const playgroundStyles = (theme: "light" | "dark"): string => {
  const c = PALETTE[theme];
  return `:root {
  color-scheme: ${theme};
  --bg: ${c.bg};
  --fg: ${c.fg};
  --muted: ${c.muted};
  --border: ${c.border};
  --surface: ${c.surface};
}

body {
  margin: 0;
  padding: 24px;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

.field {
  max-width: 320px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.group {
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.group:focus-within {
  border-color: var(--fg);
}

.group button {
  padding: 8px 14px;
  border: none;
  background: var(--surface);
  color: var(--fg);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.group button:hover:not(:disabled) {
  filter: brightness(1.15);
}

.group button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.group input {
  flex: 1;
  min-width: 80px;
  padding: 8px 10px;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
}
`;
};

const APP_STARTER = `import { NumberField } from "raqam";
import "./styles.css";

export default function App() {
  return (
    <div className="field">
      <NumberField.Root locale="en-US" defaultValue={1} minValue={0} maxValue={99}>
        <NumberField.Label>Quantity</NumberField.Label>
        <NumberField.Group className="group">
          <NumberField.Decrement>−</NumberField.Decrement>
          <NumberField.Input />
          <NumberField.Increment>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </div>
  );
}
`;

const APP_CURRENCY = `import { NumberField } from "raqam";
import "./styles.css";

export default function App() {
  return (
    <div className="field">
      <NumberField.Root
        name="price"
        locale="en-US"
        formatOptions={{ style: "currency", currency: "USD" }}
        defaultValue={1234.56}
        minValue={0}
        step={0.5}
      >
        <NumberField.Label>Price</NumberField.Label>
        <NumberField.Group className="group">
          <NumberField.Decrement>−</NumberField.Decrement>
          <NumberField.Input />
          <NumberField.Increment>+</NumberField.Increment>
        </NumberField.Group>
        {/* Submits the raw number, not the formatted string.
            Needs name="price" on Root — HiddenInput takes no props. */}
        <NumberField.HiddenInput />
      </NumberField.Root>
    </div>
  );
}
`;

const APP_PERSIAN = `import { NumberField } from "raqam";
import "raqam/locales/fa";
import "./styles.css";

export default function App() {
  return (
    <div className="field" dir="rtl">
      <NumberField.Root
        locale="fa-IR"
        formatOptions={{ style: "currency", currency: "IRR", maximumFractionDigits: 0 }}
        defaultValue={250000}
        minValue={0}
        step={50000}
      >
        <NumberField.Label>مبلغ</NumberField.Label>
        <NumberField.Group className="group">
          <NumberField.Decrement>−</NumberField.Decrement>
          {/* Type Persian digits (۱۲۳) or Latin (123) — both parse. */}
          <NumberField.Input />
          <NumberField.Increment>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </div>
  );
}
`;

export const PLAYGROUND_APP_BY_ID: Record<PlaygroundTemplateId, string> = {
  starter: APP_STARTER,
  currency: APP_CURRENCY,
  persian: APP_PERSIAN,
};
