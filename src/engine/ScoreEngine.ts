import type { AuditCategory, CategoryScore, CheckResult, GEOScoreResult } from "./types"

export const SEO_CATEGORY_WEIGHTS: Record<Exclude<AuditCategory, "ai-readiness">, number> = {
  content: 0.3,
  technical: 0.25,
  media: 0.2,
  links: 0.25,
}

export const GEO_DIMENSION_WEIGHTS = {
  definitions: 0.2,
  qaStructure: 0.2,
  citations: 0.15,
  structuredData: 0.15,
  authority: 0.15,
  organization: 0.15,
} as const

function statusValue(status: CheckResult["status"]): number {
  if (status === "pass") return 1
  if (status === "warning") return 0.5
  return 0
}

export function buildCategoryScores(results: CheckResult[]): CategoryScore[] {
  const grouped = new Map<AuditCategory, CheckResult[]>()
  for (const result of results) {
    const existing = grouped.get(result.category) ?? []
    existing.push(result)
    grouped.set(result.category, existing)
  }

  return Object.entries(SEO_CATEGORY_WEIGHTS).map(([category, weight]) => {
    const categoryResults = grouped.get(category as AuditCategory) ?? []
    const totalWeight = categoryResults.reduce((sum, result) => sum + result.weight, 0)
    const normalized = totalWeight
      ? categoryResults.reduce((sum, result) => sum + statusValue(result.status) * result.weight, 0) / totalWeight
      : 1

    return {
      category: category as AuditCategory,
      score: Math.round(normalized * 100),
      weight,
      issueCount: categoryResults.filter((result) => result.issue).length,
    }
  })
}

export function calculateSEOScore(results: CheckResult[]): number {
  const categories = buildCategoryScores(results).filter((category) => category.category !== "ai-readiness")
  const total = categories.reduce((sum, category) => sum + category.score * category.weight, 0)
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0)
  return Math.round(total / totalWeight)
}

export function calculateGEOScore(geoResults: GEOScoreResult): number {
  const score =
    geoResults.dimensions.definitions.score * GEO_DIMENSION_WEIGHTS.definitions +
    geoResults.dimensions.qaStructure.score * GEO_DIMENSION_WEIGHTS.qaStructure +
    geoResults.dimensions.citations.score * GEO_DIMENSION_WEIGHTS.citations +
    geoResults.dimensions.structuredData.score * GEO_DIMENSION_WEIGHTS.structuredData +
    geoResults.dimensions.authority.score * GEO_DIMENSION_WEIGHTS.authority +
    geoResults.dimensions.organization.score * GEO_DIMENSION_WEIGHTS.organization

  return Math.round(score)
}

