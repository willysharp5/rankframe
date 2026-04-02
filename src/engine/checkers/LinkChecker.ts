import { framer, type AnyNode } from "framer-plugin"
import type { CheckResult, LinkGraph, PageNode } from "../types"

async function resolveParentPageId(node: AnyNode, pages: Map<string, PageNode>): Promise<string | null> {
  let current: AnyNode | null = node
  while (current) {
    if (pages.has(current.id)) return current.id
    current = await current.getParent()
  }
  return null
}

function resolveInternalLink(link: string | null, pages: Map<string, PageNode>): string | null {
  if (!link) return null
  for (const [id, page] of pages) {
    const normalizedPath = page.path.startsWith("/") ? page.path : `/${page.path}`
    if (link === page.path || link === normalizedPath) return id
  }
  return null
}

export async function buildLinkGraph(): Promise<LinkGraph> {
  const pages = new Map<string, PageNode>()
  const pageNodes = await framer.getNodesWithType("WebPageNode")

  for (const node of pageNodes) {
    if (!node.path) continue
    pages.set(node.id, {
      id: node.id,
      path: node.path,
      name: node.path,
      inboundLinks: [],
      outboundLinks: [],
    })
  }

  const linkedNodes = await framer.getNodesWithAttributeSet("link")
  for (const node of linkedNodes) {
    const sourcePageId = await resolveParentPageId(node, pages)
    const targetPageId = resolveInternalLink(node.link, pages)
    if (!sourcePageId || !targetPageId) continue

    const sourcePage = pages.get(sourcePageId)
    const targetPage = pages.get(targetPageId)
    if (!sourcePage || !targetPage || sourcePageId === targetPageId) continue

    if (!sourcePage.outboundLinks.includes(targetPageId)) sourcePage.outboundLinks.push(targetPageId)
    if (!targetPage.inboundLinks.includes(sourcePageId)) targetPage.inboundLinks.push(sourcePageId)
  }

  const orphanPages: PageNode[] = []
  const underlinkedPages: PageNode[] = []
  for (const page of pages.values()) {
    if (page.path === "/" || page.path === "/index") continue
    if (page.inboundLinks.length === 0) orphanPages.push(page)
    else if (page.inboundLinks.length < 2) underlinkedPages.push(page)
  }

  return { pages, orphanPages, underlinkedPages }
}

export async function analyzeLinks(): Promise<CheckResult[]> {
  const graph = await buildLinkGraph()
  const results: CheckResult[] = []

  for (const page of graph.orphanPages) {
    results.push({
      checkId: `link-orphan-${page.id}`,
      category: "links",
      status: "fail",
      weight: 1,
      message: `${page.path} has no inbound internal links.`,
      affectedNodes: [page.id],
      issue: {
        id: `link-orphan-${page.id}`,
        category: "links",
        severity: "critical",
        title: "Orphan page detected",
        description: `${page.path} has zero inbound internal links.`,
        nodeId: page.id,
        fixType: "auto-ai",
        aiFixAvailable: true,
      },
      metadata: { inboundLinks: 0, outboundLinks: page.outboundLinks.length },
    })
  }

  for (const page of graph.underlinkedPages) {
    results.push({
      checkId: `link-underlinked-${page.id}`,
      category: "links",
      status: "warning",
      weight: 0.75,
      message: `${page.path} has fewer than two inbound internal links.`,
      affectedNodes: [page.id],
      issue: {
        id: `link-underlinked-${page.id}`,
        category: "links",
        severity: "warning",
        title: "Underlinked page",
        description: `${page.path} only has ${page.inboundLinks.length} inbound internal link(s).`,
        nodeId: page.id,
        fixType: "auto-ai",
        aiFixAvailable: true,
      },
      metadata: { inboundLinks: page.inboundLinks.length, outboundLinks: page.outboundLinks.length },
    })
  }

  if (results.length === 0) {
    results.push({
      checkId: "link-graph-ok",
      category: "links",
      status: "pass",
      weight: 1,
      message: "Internal link graph has no orphan or underlinked pages.",
      affectedNodes: [],
    })
  }

  return results
}
