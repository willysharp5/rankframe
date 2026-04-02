import { framer } from "framer-plugin"
import { analyzeAltText } from "./checkers/AltTextChecker"
import { analyzeContent } from "./checkers/ContentChecker"
import { analyzeEEAT, analyzeEEATChecks } from "./checkers/EEATChecker"
import { analyzeGEO, analyzeGEOChecks } from "./checkers/GEOChecker"
import { analyzeHeadings } from "./checkers/HeadingChecker"
import { analyzeLinks } from "./checkers/LinkChecker"
import { analyzeMeta } from "./checkers/MetaChecker"
import { analyzeSchema } from "./checkers/SchemaChecker"
import { buildCategoryScores, calculateGEOScore, calculateSEOScore } from "./ScoreEngine"
import type { AuditResult, CheckResult } from "./types"

export interface AuditEngineOptions {
  pageId?: string | null
}

export class AuditEngine {
  async run(options: AuditEngineOptions = {}): Promise<AuditResult> {
    const [headingResults, altResults, metaResults, schemaResults, linkResults, contentResults, geo, geoChecks, eeat, eeatChecks] =
      await Promise.all([
        analyzeHeadings(options.pageId ?? undefined),
        analyzeAltText(),
        analyzeMeta(),
        analyzeSchema(),
        analyzeLinks(),
        analyzeContent(),
        analyzeGEO(),
        analyzeGEOChecks(),
        analyzeEEAT(),
        analyzeEEATChecks(),
      ])

    const seoResults: CheckResult[] = [
      ...headingResults,
      ...altResults,
      ...metaResults,
      ...schemaResults,
      ...linkResults,
      ...contentResults,
    ]
    const allResults = [...seoResults, ...geoChecks, ...eeatChecks]
    const categories = buildCategoryScores(allResults)
    const issues = allResults.flatMap((result) => (result.issue ? [result.issue] : []))
    const aiCreditsUsed = Number((await framer.getPluginData("rankframe.ai.creditsUsed")) ?? "0")

    return {
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      pageId: options.pageId ?? null,
      seoScore: calculateSEOScore(seoResults),
      geoScore: calculateGEOScore(geo),
      contentScore: this.extractContentScore(contentResults),
      eeatScore: eeat.eeatScore,
      categories,
      issues,
      aiCreditsUsed,
    }
  }

  private extractContentScore(results: CheckResult[]): number {
    const penalties = results.filter((result) => result.status !== "pass").reduce((total, result) => total + (result.status === "fail" ? 25 : 12.5), 0)
    return Math.max(0, Math.round(100 - penalties))
  }
}

