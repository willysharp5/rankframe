import { framer } from "framer-plugin"
import type { CheckResult, EEATDimensionScore, EEATScoreResult } from "../types"

function makeDimension(score: number, signals: string[], missing: string[]): EEATDimensionScore {
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    signals,
    missing,
  }
}

export async function analyzeEEAT(): Promise<EEATScoreResult> {
  const textNodes = await framer.getNodesWithType("TextNode")
  const textContent = (await Promise.all(textNodes.map((node) => node.getText())))
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()

  const pages = await framer.getNodesWithType("WebPageNode")
  const pagePaths = pages.map((page) => page.path ?? "").join(" ")

  const experienceSignals = textContent.includes("we tested") || textContent.includes("our experience")
  const expertiseSignals = textContent.includes("certified") || textContent.includes("expert") || textContent.includes("years of experience")
  const authoritySignals = textContent.includes("cited by") || textContent.includes("research") || textContent.includes("case study")
  const trustSignals =
    pagePaths.includes("/contact") || pagePaths.includes("/about") || textContent.includes("privacy policy") || textContent.includes("terms")

  const experience = makeDimension(experienceSignals ? 80 : 40, experienceSignals ? ["First-hand experience language found."] : [], experienceSignals ? [] : ["Show first-hand experience or original usage evidence."])
  const expertise = makeDimension(expertiseSignals ? 80 : 35, expertiseSignals ? ["Expertise signals found."] : [], expertiseSignals ? [] : ["Add author credentials or expertise markers."])
  const authoritativeness = makeDimension(authoritySignals ? 75 : 35, authoritySignals ? ["Authority signals found."] : [], authoritySignals ? [] : ["Add citations, mentions, or recognisable proof."])
  const trustworthiness = makeDimension(trustSignals ? 85 : 40, trustSignals ? ["Trust pages/signals found."] : [], trustSignals ? [] : ["Ensure about/contact/privacy paths are accessible."])

  const eeatScore = Math.round(
    experience.score * 0.25 +
      expertise.score * 0.25 +
      authoritativeness.score * 0.25 +
      trustworthiness.score * 0.25
  )

  return {
    eeatScore,
    experience,
    expertise,
    authoritativeness,
    trustworthiness,
    recommendations: [
      ...experience.missing,
      ...expertise.missing,
      ...authoritativeness.missing,
      ...trustworthiness.missing,
    ],
  }
}

export async function analyzeEEATChecks(): Promise<CheckResult[]> {
  const eeat = await analyzeEEAT()
  const dimensions = [
    ["experience", eeat.experience],
    ["expertise", eeat.expertise],
    ["authoritativeness", eeat.authoritativeness],
    ["trustworthiness", eeat.trustworthiness],
  ] as const

  const results: CheckResult[] = dimensions
    .filter(([, dimension]) => dimension.missing.length > 0)
    .map(([name, dimension]) => ({
      checkId: `eeat-${name}`,
      category: "ai-readiness" as const,
      status: dimension.score < 50 ? "fail" as const : "warning" as const,
      weight: 1,
      message: `${name} score is ${dimension.score}.`,
      affectedNodes: [],
      issue: {
        id: `eeat-${name}`,
        category: "ai-readiness" as const,
        severity: dimension.score < 50 ? "critical" as const : "warning" as const,
        title: `Weak E-E-A-T signal: ${name}`,
        description: dimension.missing.join(" "),
        fixType: "manual" as const,
        aiFixAvailable: true,
      },
      metadata: { score: dimension.score, signals: dimension.signals },
    }))

  if (results.length === 0) {
    results.push({
      checkId: "eeat-ok",
      category: "ai-readiness",
      status: "pass",
      weight: 1,
      message: `E-E-A-T baseline looks healthy (${eeat.eeatScore}/100).`,
      affectedNodes: [],
      metadata: { eeatScore: eeat.eeatScore },
    })
  }

  return results
}
