import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { NumberField } from "../react/NumberField.js";

const meta = {
  title: "raqam/ScrubArea",
  component: NumberField.Root,
  tags: ["autodocs"],
} satisfies Meta<typeof NumberField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const inputStyle: React.CSSProperties = {
  padding: "6px 8px",
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: "0 4px 4px 0",
  outline: "none",
  width: 70,
  borderLeft: "none",
};

const labelScrubStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  background: "#f0f0f0",
  border: "1px solid #ccc",
  borderRadius: "4px 0 0 4px",
  fontSize: 12,
  fontWeight: 600,
  color: "#444",
  // cursor applied by useScrubArea
};

export const HorizontalScrub: Story = {
  name: "Horizontal Scrub (drag left/right)",
  render: () => (
    <div style={{ fontFamily: "system-ui" }}>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        🖱 Drag the label left/right to change the value
      </p>
      <NumberField.Root locale="en-US" defaultValue={50} minValue={0} maxValue={100} step={1}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <NumberField.ScrubArea direction="horizontal" pixelSensitivity={2} style={labelScrubStyle}>
            <NumberField.Label style={{ margin: 0, cursor: "inherit" }}>Opacity</NumberField.Label>
          </NumberField.ScrubArea>
          <NumberField.Input style={inputStyle} />
        </div>
      </NumberField.Root>
    </div>
  ),
};

export const VerticalScrub: Story = {
  name: "Vertical Scrub (drag up/down)",
  render: () => (
    <div style={{ fontFamily: "system-ui" }}>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        🖱 Drag the label up/down to change the value
      </p>
      <NumberField.Root locale="en-US" defaultValue={0} step={1}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <NumberField.ScrubArea direction="vertical" pixelSensitivity={4} style={labelScrubStyle}>
            <NumberField.Label style={{ margin: 0, cursor: "inherit" }}>Y Position</NumberField.Label>
          </NumberField.ScrubArea>
          <NumberField.Input style={inputStyle} />
        </div>
      </NumberField.Root>
    </div>
  ),
};

export const MultiAxisScrub: Story = {
  name: "Multi-Axis Scrub",
  render: () => {
    const [x, setX] = useState<number | null>(0);
    const [y, setY] = useState<number | null>(0);
    return (
      <div style={{ fontFamily: "system-ui" }}>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          Drag any label in any direction
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NumberField.Root locale="en-US" value={x} onChange={setX} step={1}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <NumberField.ScrubArea direction="horizontal" style={labelScrubStyle}>
                <NumberField.Label style={{ margin: 0, cursor: "inherit" }}>X</NumberField.Label>
              </NumberField.ScrubArea>
              <NumberField.Input style={inputStyle} />
            </div>
          </NumberField.Root>
          <NumberField.Root locale="en-US" value={y} onChange={setY} step={1}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <NumberField.ScrubArea direction="vertical" style={labelScrubStyle}>
                <NumberField.Label style={{ margin: 0, cursor: "inherit" }}>Y</NumberField.Label>
              </NumberField.ScrubArea>
              <NumberField.Input style={inputStyle} />
            </div>
          </NumberField.Root>
        </div>
      </div>
    );
  },
};

export const WithCustomCursor: Story = {
  name: "With ScrubAreaCursor",
  render: () => (
    <div style={{ fontFamily: "system-ui" }}>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        A custom cursor element is shown while dragging (via pointer lock)
      </p>
      <NumberField.Root locale="en-US" defaultValue={50} step={1}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <NumberField.ScrubArea direction="horizontal" pixelSensitivity={2} style={labelScrubStyle}>
            <NumberField.Label style={{ margin: 0, cursor: "inherit" }}>Value</NumberField.Label>
          </NumberField.ScrubArea>
          <NumberField.Input style={inputStyle} />
        </div>
        {/* Custom cursor — only visible while scrubbing */}
        <NumberField.ScrubAreaCursor>
          <span style={{ fontSize: 24 }}>↔</span>
        </NumberField.ScrubAreaCursor>
      </NumberField.Root>
    </div>
  ),
};
