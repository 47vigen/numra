import {
  SandpackLayout,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { useEffect, useState } from "react";
import {
  PLAYGROUND_APP_BY_ID,
  PLAYGROUND_TEMPLATE_META,
  RAQAM_VERSION,
  type PlaygroundTemplateId,
} from "./playground-templates";

function useStarlightTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const el = document.documentElement;
    const read = () => {
      const t = el.getAttribute("data-theme");
      setTheme(t === "dark" ? "dark" : "light");
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return theme;
}

export function RaqamSandpack() {
  const [templateId, setTemplateId] = useState<PlaygroundTemplateId>("starter");
  const starlightTheme = useStarlightTheme();
  const sandpackTheme = starlightTheme === "dark" ? "dark" : "light";

  return (
    <div className="raqam-playground">
      <div className="raqam-playground__toolbar">
        <div className="raqam-playground__controls">
          <label className="raqam-playground__label" htmlFor="raqam-playground-template">
            Example
          </label>
          <select
            className="raqam-playground__select"
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
        <p className="raqam-playground__hint">
          Sandbox installs <code>raqam@{RAQAM_VERSION}</code> from npm (same as{" "}
          <code>npm install raqam</code>).
        </p>
      </div>
      <div className="raqam-playground__embed">
        <SandpackProvider
          template="react-ts"
          theme={sandpackTheme}
          customSetup={{
            dependencies: {
              raqam: RAQAM_VERSION,
            },
          }}
          files={{
            "/App.tsx": PLAYGROUND_APP_BY_ID[templateId],
          }}
          options={{
            initMode: "user-visible",
          }}
        >
          <SandpackLayout style={{ minHeight: 420 }} />
        </SandpackProvider>
      </div>
    </div>
  );
}
