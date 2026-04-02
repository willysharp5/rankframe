import { framer } from "framer-plugin"
import type { CheckResult, HeadingNode, IssueSeverity } from "../types"

function severityToStatus(severity: IssueSeverity): CheckResult["status"] {
  if (severity === "critical") return "fail"
  if (severity === "warning") return "warning"
  return "pass"
}

function getHeadingLevel(tag: string | null | undefined): number | null {
  if (!tag || !/^h[1-6]$/i.test(tag)) return null
  return Number(tag[1])
}

export async function analyzeHeadings(pageNodeId?: string): Promise<CheckResult[]> {
  const root = pageNodeId ? await framer.getNode(pageNodeId) : null
  const textNodes = root
    ? await root.getNodesWithType("TextNode")
    : await framer.getNodesWithType("TextNode")

  const headings: HeadingNode[] = []
  for (const node of textNodes) {
    const tag = node.inlineTextStyle?.tag ?? "p"
    const level = getHeadingLevel(tag)
    if (!level) continue

    headings.push({
      nodeId: node.id,
      text: (await node.getText()) ?? node.name ?? "",
      level,
      parentPageId: pageNodeId ?? "site",
      depth: headings.length,
    })
  }

  const results: CheckResult[] = []
  const h1s = headings.filter((heading) => heading.level === 1)

  if (h1s.length === 0) {
    results.push({
      checkId: "heading-missing-h1",
      category: "content",
      status: "fail",
      weight: 1,
      message: "Every page should have exactly one H1, but none was found.",
      affectedNodes: [],
      issue: {
        id: "heading-missing-h1",
        category: "content",
        severity: "critical",
        title: "Missing H1 tag",
        description: "Every page should have exactly one H1 tag. This page has none.",
        fixType: "semi-auto",
        aiFixAvailable: true,
      },
    })
  }

  if (h1s.length > 1) {
    results.push({
      checkId: "heading-multiple-h1",
      category: "content",
      status: "fail",
      weight: 1,
      message: `Expected one H1, found ${h1s.length}.`,
      affectedNodes: h1s.map((heading) => heading.nodeId),
      issue: {
        id: "heading-multiple-h1",
        category: "content",
        severity: "critical",
        title: `Multiple H1 tags (${h1s.length})`,
        description: "Only one H1 tag should exist per page.",
        nodeId: h1s[0]?.nodeId,
        fixType: "semi-auto",
        aiFixAvailable: true,
      },
    })
  }

  for (let index = 1; index < headings.length; index += 1) {
    const previous = headings[index - 1]
    const current = headings[index]
    if (current.level <= previous.level + 1) continue

    const severity: IssueSeverity = "warning"
    results.push({
      checkId: `heading-skipped-${current.nodeId}`,
      category: "content",
      status: severityToStatus(severity),
      weight: 0.75,
      message: `Heading level skipped: H${previous.level} to H${current.level}.`,
      affectedNodes: [current.nodeId],
      issue: {
        id: `heading-skipped-${current.nodeId}`,
        category: "content",
        severity,
        title: `Heading level skipped: H${previous.level} -> H${current.level}`,
        description: `"${current.text.slice(0, 40)}" jumps from H${previous.level} to H${current.level}.`,
        nodeId: current.nodeId,
        fixType: "semi-auto",
        aiFixAvailable: true,
      },
      metadata: {
        expectedLevel: previous.level + 1,
        actualLevel: current.level,
      },
    })
  }

  if (results.length === 0) {
    results.push({
      checkId: "heading-structure-ok",
      category: "content",
      status: "pass",
      weight: 1,
      message: "Heading hierarchy is valid.",
      affectedNodes: headings.map((heading) => heading.nodeId),
    })
  }

  return results
}
