import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { NumberField } from "../react/NumberField.js";

// Import all locale plugins so non-Latin digits are normalized
import "../locales/fa.js";
import "../locales/ar.js";
import "../locales/hi.js";
import "../locales/bn.js";

const meta = {
  title: "numra/Locales & i18n",
  component: NumberField.Root,
  tags: ["autodocs"],
} satisfies Meta<typeof NumberField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const inputStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 14,
  border: "1px solid #ccc",
  borderRadius: 6,
  outline: "none",
  minWidth: 160,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#555",
  fontFamily: "system-ui",
};

const groupStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 0,
};

const btnStyle: React.CSSProperties = {
  padding: "6px 10px",
  background: "#f5f5f5",
  border: "1px solid #ccc",
  cursor: "pointer",
  fontSize: 14,
};

function LocaleField({ locale, label }: { locale: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "system-ui" }}>
      <label style={labelStyle}>{label} ({locale})</label>
      <div style={groupStyle}>
        <NumberField.Root locale={locale} defaultValue={1234567.89}>
          <NumberField.Group style={{ display: "flex", alignItems: "center" }}>
            <button style={{ ...btnStyle, borderRight: "none", borderRadius: "4px 0 0 4px" }}>−</button>
            <NumberField.Input style={{ ...inputStyle, borderRadius: 0 }} />
            <button style={{ ...btnStyle, borderLeft: "none", borderRadius: "0 4px 4px 0" }}>+</button>
          </NumberField.Group>
        </NumberField.Root>
      </div>
    </div>
  );
}

export const AllLocales: Story = {
  name: "All Locales",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 20 }}>
      <LocaleField locale="en-US" label="English (US)" />
      <LocaleField locale="de-DE" label="German (Germany)" />
      <LocaleField locale="fr-FR" label="French (France)" />
      <LocaleField locale="fa-IR" label="Persian (Iran)" />
      <LocaleField locale="ar-EG" label="Arabic (Egypt)" />
      <LocaleField locale="hi-IN" label="Hindi (India) — lakh grouping" />
      <LocaleField locale="bn-BD" label="Bengali (Bangladesh)" />
    </div>
  ),
};

export const PersianInput: Story = {
  name: "Persian Digit Input (fa-IR)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "system-ui" }}>
      <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
        Type Persian digits (۱۲۳۴۵) — they are normalized to Latin and re-formatted
      </p>
      <NumberField.Root locale="fa-IR" defaultValue={0}>
        <NumberField.Label style={labelStyle}>مبلغ (fa-IR)</NumberField.Label>
        <NumberField.Group style={{ display: "flex" }}>
          <NumberField.Decrement style={{ ...btnStyle, borderRadius: "4px 0 0 4px", borderRight: "none" }}>−</NumberField.Decrement>
          <NumberField.Input style={{ ...inputStyle, borderRadius: 0, direction: "rtl" }} />
          <NumberField.Increment style={{ ...btnStyle, borderRadius: "0 4px 4px 0", borderLeft: "none" }}>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </div>
  ),
};
