import { notFound } from "next/navigation"
import { source } from "@/lib/source"

export const dynamic = "force-static"

export function generateStaticParams() {
  return source.generateParams()
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params
  const page = source.getPage(slug)
  if (!page) notFound()

  // `getText("processed")` — reading `page.data._markdown` returns undefined in
  // fumadocs-mdx 15, which silently served title-only pages.
  const md = await page.data.getText("processed")
  const body = `# ${page.data.title}\n\n${page.data.description ?? ""}\n\n${md}`.trim()

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}
