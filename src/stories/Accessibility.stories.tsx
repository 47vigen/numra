import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { NumberField } from "../react/NumberField.js";

const meta = {
  title: "numra/Accessibility",
  component: NumberField.Root,
  tags: ["autodocs"],
} satisfies Meta<typeof NumberField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 15,
  border: "1px solid #ccc",
  borderRadius: 6,
  outline: "none",
  minWidth: 150,
};

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "#f5f5f5",
  border: "1px solid #ccc",
  cursor: "pointer",
  borderRadius: 4,
};

export const FullARIA: Story = {
  name: "Full ARIA Spinbutton",
  render: () => (
    <div style={{ fontFamily: "system-ui", display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
        This field has complete ARIA spinbutton attributes — inspect with a screen reader.
      </p>
      <NumberField.Root
        locale="en-US"
        defaultValue={42}
        minValue={0}
        maxValue={100}
        step={1}
        aria-label="Score"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <NumberField.Label style={{ fontSize: 13, fontWeight: 600 }}>Score</NumberField.Label>
          <div style={{ display: "flex", gap: 6 }}>
            <NumberField.Decrement style={btnStyle}>−</NumberField.Decrement>
            <NumberField.Input style={inputStyle} />
            <NumberField.Increment style={btnStyle}>+</NumberField.Increment>
          </div>
          <NumberField.Description style={{ fontSize: 12, color: "#888" }}>
            Enter a score between 0 and 100
          </NumberField.Description>
        </div>
      </NumberField.Root>
    </div>
  ),
};

export const InvalidState: Story = {
  name: "Invalid / Out-of-Range",
  render: () => (
    <div style={{ fontFamily: "system-ui", display: "flex", flexDirection: "column", gap: 8 }}>
      <NumberField.Root
        locale="en-US"
        defaultValue={150}
        minValue={0}
        maxValue={100}
        allowOutOfRange
        clampBehavior="none"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <NumberField.Label style={{ fontSize: 13, fontWeight: 600 }}>
            Quantity (max 100)
          </NumberField.Label>
          <NumberField.Input
            style={{ ...inputStyle, borderColor: "#e53e3e" }}
          />
          <NumberField.ErrorMessage style={{ fontSize: 12, color: "#e53e3e" }}>
            Value exceeds maximum of 100
          </NumberField.ErrorMessage>
        </div>
      </NumberField.Root>
    </div>
  ),
};

export const KeyboardGuide: Story = {
  name: "Keyboard Navigation Guide",
  render: () => (
    <div style={{ fontFamily: "system-ui", display: "flex", flexDirection: "column", gap: 16 }}>
      <NumberField.Root locale="en-US" defaultValue={50} minValue={0} maxValue={100} step={1}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <NumberField.Label style={{ fontSize: 13, fontWeight: 600 }}>
            Focus here and use keyboard:
          </NumberField.Label>
          <NumberField.Input style={inputStyle} />
        </div>
      </NumberField.Root>
      <table style={{ fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "4px 12px", textAlign: "left", border: "1px solid #eee" }}>Key</th>
            <th style={{ padding: "4px 12px", textAlign: "left", border: "1px solid #eee" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["↑ / ↓", "Increment / decrement by step (1)"],
            ["Shift + ↑/↓", "Increment / decrement by largeStep (10)"],
            ["Ctrl/Cmd + ↑/↓", "Increment / decrement by smallStep (0.1)"],
            ["Page Up / Down", "Increment / decrement by largeStep (10)"],
            ["Home", "Jump to minimum value (0)"],
            ["End", "Jump to maximum value (100)"],
            ["Enter", "Commit and format"],
          ].map(([key, action]) => (
            <tr key={key}>
              <td style={{ padding: "4px 12px", border: "1px solid #eee", fontFamily: "monospace" }}>{key}</td>
              <td style={{ padding: "4px 12px", border: "1px solid #eee" }}>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
