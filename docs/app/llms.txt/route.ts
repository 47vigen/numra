import { getMarkdownUrl, source } from "@/lib/source"
import { appDescription, appName, githubUrl, siteUrl } from "@/lib/shared"

// https://llmstxt.org — an index an agent can read in one request, pointing at
// the raw-markdown route for every page. See ./llms-full.txt for the whole
// corpus inlined.
export const dynamic = "force-static"

// A page's first path segment is its section; keep the order the sidebar uses.
const SECTION_TITLES: Record<string, string> = {
  "": "Start here",
  api: "API reference",
  guides: "Guides",
  recipes: "Recipes",
}
const SECTION_ORDER = ["", "api", "guides", "recipes"]

export function GET() {
  const pages = source.getPages()

  const bySection = new Map<string, string[]>()
  for (const page of pages) {
    const section = page.slugs.length > 1 ? page.slugs[0] : ""
    const line = `- [${page.data.title}](${siteUrl}${getMarkdownUrl(page.slugs)}): ${
      page.data.description ?? ""
    }`.trimEnd()
    bySection.set(section, [...(bySection.get(section) ?? []), line])
  }

  const sections = [...bySection.keys()].sort(
    (a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b),
  )

  const body = [
    `# ${appName}`,
    "",
    `> ${appDescription} Zero runtime dependencies, ~2.2 KB core, React 18/19.`,
    "",
    "Import `NumberField` for the compound components, or `useNumberFieldState`",
    "+ `useNumberField` to own the DOM. Configure formatting on `NumberField.Root`",
    "(`locale`, `formatOptions` — passed to `Intl.NumberFormat`), never on `Input`.",
    "Native `<form>` submission needs `name` on `Root` plus `<NumberField.HiddenInput />`,",
    "because the visible input holds the formatted string. Typing non-Latin digits",
    "needs a side-effect import: `import \"raqam/locales/fa\"` (also `ar`, `bn`, `hi`, `th`).",
    "",
    ...sections.flatMap((section) => [
      `## ${SECTION_TITLES[section] ?? section}`,
      "",
      ...(bySection.get(section) ?? []).sort(),
      "",
    ]),
    "## Optional",
    "",
    `- [Full documentation, inlined](${siteUrl}/llms-full.txt): every page above as one file`,
    `- [Repository](${githubUrl}): source, issues, and an installable agent skill under \`skills/raqam\``,
    `- [AGENTS.md](${githubUrl}/blob/main/AGENTS.md): conventions for agents working in this repo`,
    "",
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
