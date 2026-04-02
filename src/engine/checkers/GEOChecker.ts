import { framer } from "framer-plugin"
import type { CheckResult, DimensionScore, GEOScoreResult } from "../types"

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function buildDimension(score: number, issues: string[]): DimensionScore {
  return { score: clampScore(score), issues }
}

export async function analyzeGEO(): Promise<GEOScoreResult> {
  const textNodes = await framer.getNodesWithType("TextNode")
  const textParts = await Promise.all(textNodes.map((node) => node.getText()))
  const content = textParts.filter((part): part is string => Boolean(part)).join("\n")
  const lower = content.toLowerCase()
  const codeFiles = await framer.getCodeFiles()

  const definitionCount = (lower.match(/\bis\b/g) ?? []).length
  const questionHeadings = textNodes.filter((node) => {
    const tag = node.inlineTextStyle?.tag
    return Boolean(tag?.match(/^h[2-6]$/))
  }).length
  const citationHits = (lower.match(/\bsource\b|\bcitation\b|\breference\b|\baccording to\b/g) ?? []).length
  const hasSchema = codeFiles.some((file) => file.content.includes("application/ld+json") || file.content.includes('"@context"'))
  const authorityHits = (lower.match(/\bdata\b|\bstudy\b|\bresearch\b|\bexpert\b|\byears of experience\b/g) ?? []).length
  const organizationHits = (lower.match(/\bsummary\b|\btl;dr\b|\bkey takeaways\b/g) ?? []).length

  const dimensions = {
    definitions: buildDimension(Math.min(100, definitionCount * 12.5), definitionCount > 0 ? [] : ["Add direct definitions to answer AI retrieval queries."]),
    qaStructure: buildDimension(Math.min(100, questionHeadings * 20), questionHeadings > 0 ? [] : ["Use explicit question-style headings."]),
    citations: buildDimension(Math.min(100, citationHits * 25), citationHits > 0 ? [] : ["Add citations or explicit source references."]),
    structuredData: buildDimension(hasSchema ? 100 : 30, hasSchema ? [] : ["Add JSON-LD structured data."]),
    authority: buildDimension(Math.min(100, authorityHits * 20), authorityHits > 0 ? [] : ["Back claims with expertise, data, or studies."]),
    organization: buildDimension(Math.min(100, organizationHits * 40 + 40), organizationHits > 0 ? [] : ["Include a summary or key takeaways section."]),
  }

  const geoScore = Math.round(
    dimensions.definitions.score * 0.2 +
      dimensions.qaStructure.score * 0.2 +
      dimensions.citations.score * 0.15 +
      dimensions.structuredData.score * 0.15 +
      dimensions.authority.score * 0.15 +
      dimensions.organization.score * 0.15
  )

  const recommendations = Object.values(dimensions)
    .flatMap((dimension) => dimension.issues)
    .slice(0, 6)

  return { geoScore, dimensions, recommendations }
}

export async function analyzeGEOChecks(): Promise<CheckResult[]> {
  const geo = await analyzeGEO()
  const results: CheckResult[] = []

  for (const [dimension, score] of Object.entries(geo.dimensions)) {
    if (score.issues.length === 0) continue
    results.push({
      checkId: `geo-${dimension}`,
      category: "ai-readiness",
      status: score.score < 50 ? "fail" : "warning",
      weight: 1,
      message: `${dimension} scored ${score.score}.`,
      affectedNodes: [],
      issue: {
        id: `geo-${dimension}`,
        category: "ai-readiness",
        severity: score.score < 50 ? "critical" : "warning",
        title: `GEO weakness: ${dimension}`,
        description: score.issues.join(" "),
        fixType: "manual",
        aiFixAvailable: true,
      },
      metadata: { score: score.score },
    })
  }

  if (results.length === 0) {
    results.push({
      checkId: "geo-ok",
      category: "ai-readiness",
      status: "pass",
      weight: 1,
      message: `GEO baseline looks healthy (${geo.geoScore}/100).`,
      affectedNodes: [],
      metadata: { geoScore: geo.geoScore },
    })
  }

  return results
}
