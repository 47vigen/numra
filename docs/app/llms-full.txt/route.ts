import { source } from "@/lib/source"
import { appDescription, appName } from "@/lib/shared"

// The whole docs corpus in one request, for agents that would rather read once
// than crawl the index at /llms.txt.
export const dynamic = "force-static"

export async function GET() {
  const pages = source
    .getPages()
    .slice()
    .sort((a, b) => a.url.localeCompare(b.url))

  const body = [
    `# ${appName} — full documentation`,
    "",
    `> ${appDescription}`,
    "",
    ...(await Promise.all(
      pages.map(async (page) =>
        [
          "---",
          "",
          `# ${page.data.title}`,
          page.data.description ? `\n${page.data.description}` : "",
          "",
          await page.data.getText("processed"),
          "",
        ].join("\n"),
      ),
    )),
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
