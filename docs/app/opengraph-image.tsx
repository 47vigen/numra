import { ImageResponse } from "next/og"
import { appName } from "@/lib/shared"

// Inherited by every route, so one card covers the whole site. The layout
// mirrors assets/raqam-poster.jpg — paper background, goose square, numeral
// column — but renders live text, so the size claim can't go stale in art.
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = `${appName} — the definitive React number input`

const PAPER = "#faf9f7"
const INK = "#1b1a17"
const GOOSE = "#2c5c4c"
const HAIRLINE = "#dedcd7"

// Plain digit triples only — the grouped Persian form needs U+066C, which the
// fallback face substitutes into garbage.
// Arabic ١٢٣ is dropped: the fallback face renders it identically to Persian.
const NUMERALS = ["1,234.00", "۱۲۳", "१२३", "১২৩"]

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: PAPER,
        color: INK,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          flex: "1 1 0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 64px",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", width: 42, height: 42, background: GOOSE }} />
        <div style={{ display: "flex", fontSize: 140, fontWeight: 700, letterSpacing: -6 }}>
          raqam
        </div>
        <div style={{ display: "flex", fontSize: 38, color: "#3d3b36" }}>
          The definitive React number input
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 16,
            letterSpacing: 1.5,
            color: "#6b6862",
            fontFamily: "monospace",
          }}
        >
          LIVE FORMATTING · FULL I18N · HEADLESS · ACCESSIBLE · ~2.2 KB
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 22,
          width: 340,
          padding: "0 52px",
          borderLeft: `2px solid ${HAIRLINE}`,
        }}
      >
        {NUMERALS.map((n) => (
          <div key={n} style={{ display: "flex", fontSize: 46, color: "#93a89f" }}>
            {n}
          </div>
        ))}
      </div>
    </div>,
    size,
  )
}
