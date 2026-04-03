import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { NumberField } from "../react/NumberField.js";

const meta = {
  title: "raqam/Currency & Formatting",
  component: NumberField.Root,
  tags: ["autodocs"],
} satisfies Meta<typeof NumberField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontFamily: "system-ui",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 15,
  border: "1px solid #ccc",
  borderRadius: 6,
  outline: "none",
  minWidth: 180,
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#555" };

export const USD: Story = {
  name: "USD Currency",
  render: () => (
    <div style={fieldStyle}>
      <NumberField.Root
        locale="en-US"
        defaultValue={1234.56}
        formatOptions={{ style: "currency", currency: "USD" }}
        minimumFractionDigits={2}
        maximumFractionDigits={2}
        fixedDecimalScale
      >
        <NumberField.Label style={labelStyle}>Price (USD)</NumberField.Label>
        <NumberField.Input style={inputStyle} />
      </NumberField.Root>
    </div>
  ),
};

export const EUR: Story = {
  name: "EUR Currency (de-DE)",
  render: () => (
    <div style={fieldStyle}>
      <NumberField.Root
        locale="de-DE"
        defaultValue={1234.56}
        formatOptions={{ style: "currency", currency: "EUR" }}
        minimumFractionDigits={2}
        maximumFractionDigits={2}
      >
        <NumberField.Label style={labelStyle}>Preis (EUR, de-DE)</NumberField.Label>
        <NumberField.Input style={inputStyle} />
      </NumberField.Root>
    </div>
  ),
};

export const Percent: Story = {
  name: "Percentage",
  render: () => (
    <div style={fieldStyle}>
      <NumberField.Root
        locale="en-US"
        defaultValue={0.42}
        formatOptions={{ style: "percent", minimumFractionDigits: 1 }}
        step={0.01}
        minValue={0}
        maxValue={1}
      >
        <NumberField.Label style={labelStyle}>Tax Rate</NumberField.Label>
        <NumberField.Input style={inputStyle} />
      </NumberField.Root>
    </div>
  ),
};

export const CustomPrefixSuffix: Story = {
  name: "Custom Prefix / Suffix",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={fieldStyle}>
        <NumberField.Root locale="en-US" defaultValue={99.99} prefix="$">
          <NumberField.Label style={labelStyle}>Dollar prefix</NumberField.Label>
          <NumberField.Input style={inputStyle} />
        </NumberField.Root>
      </div>
      <div style={fieldStyle}>
        <NumberField.Root locale="fa-IR" defaultValue={15000} suffix=" تومان">
          <NumberField.Label style={labelStyle}>Toman suffix (fa-IR)</NumberField.Label>
          <NumberField.Input style={{ ...inputStyle, textAlign: "right" }} />
        </NumberField.Root>
      </div>
    </div>
  ),
};

export const Compact: Story = {
  name: "Compact Notation",
  render: () => (
    <div style={fieldStyle}>
      <NumberField.Root
        locale="en-US"
        defaultValue={1500000}
        formatOptions={{ notation: "compact", compactDisplay: "short" }}
      >
        <NumberField.Label style={labelStyle}>Revenue (compact)</NumberField.Label>
        <NumberField.Input style={inputStyle} />
      </NumberField.Root>
    </div>
  ),
};
