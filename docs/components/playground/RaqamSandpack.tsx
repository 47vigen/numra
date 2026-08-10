"use client"

import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  PLAYGROUND_APP_BY_ID,
  PLAYGROUND_TEMPLATE_META,
  playgroundStyles,
  RAQAM_VERSION,
  type PlaygroundTemplateId,
} from "./playground-templates"

export function RaqamSandpack() {
  const [templateId, setTemplateId] = useState<PlaygroundTemplateId>("starter")
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  // Avoid a hydration mismatch: `resolvedTheme` is undefined on first render.
  useEffect(() => setMounted(true), [])
  const sandpackTheme = mounted && resolvedTheme === "dark" ? "dark" : "light"

  return (
    <div className="my-7 w-full">
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label
            className="text-sm font-semibold text-fd-foreground"
            htmlFor="raqam-playground-template"
          >
            Example
          </label>
          <select
            className="min-w-48 border border-fd-border bg-fd-background px-2.5 py-1.5 text-sm text-fd-foreground"
            id="raqam-playground-template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as PlaygroundTemplateId)}
          >
            {PLAYGROUND_TEMPLATE_META.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs leading-relaxed text-fd-muted-foreground">
          Sandbox installs <code className="font-mono">raqam@{RAQAM_VERSION}</code> from npm
          (same as <code className="font-mono">npm install raqam</code>).
        </p>
      </div>
      <div className="w-full overflow-hidden border border-fd-border bg-fd-background [&_.sp-wrapper]:max-w-full">
        <SandpackProvider
          // Remount on switch: Fast Refresh keeps the old state, so a new
          // template's defaultValue would otherwise never take effect.
          key={templateId}
          template="react-ts"
          theme={sandpackTheme}
          customSetup={{ dependencies: { raqam: RAQAM_VERSION } }}
          files={{
            "/App.tsx": PLAYGROUND_APP_BY_ID[templateId],
            "/styles.css": { code: playgroundStyles(sandpackTheme), hidden: true },
          }}
          // The default ~40s bundler timeout can't cold-build a freshly
          // published version — every attempt dies mid-download, so the cache
          // never warms and the playground stays broken after each release.
          options={{ initMode: "user-visible", bundlerTimeOut: 180_000 }}
        >
          {/* SandpackLayout is a bare container — an empty one renders nothing. */}
          <SandpackLayout>
            <SandpackCodeEditor
              showLineNumbers
              showTabs={false}
              style={{ height: 420 }}
            />
            <SandpackPreview
              showOpenInCodeSandbox
              showRefreshButton
              style={{ height: 420 }}
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  )
}
