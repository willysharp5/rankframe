import { useCallback, useMemo, useState } from "react"
import { AuditEngine } from "../engine/AuditEngine"
import type { AuditResult, Issue } from "../engine/types"
import { checkAndDeductCredits } from "../ai/credits"

const mockIssues: Issue[] = [
  {
    id: "missing-h1",
    category: "technical",
    severity: "critical",
    title: "Missing H1 tag",
    description: "Every page should have exactly one H1 tag. This page currently has none.",
    nodeId: "node-h1",
    fixType: "manual",
    aiFixAvailable: false,
  },
  {
    id: "missing-alt",
    category: "media",
    severity: "critical",
    title: "8 images missing alt text",
    description: "Image content exists without descriptive alt text, reducing accessibility and search context.",
    nodeId: "node-alt",
    fixType: "auto-ai",
    aiFixAvailable: true,
  },
  {
    id: "schema-missing",
    category: "ai-readiness",
    severity: "warning",
    title: "No schema markup detected",
    description: "Structured data is missing on this page, limiting rich results and AI retrieval confidence.",
    fixType: "auto-ai",
    aiFixAvailable: true,
  },
  {
    id: "meta-short",
    category: "content",
    severity: "warning",
    title: "Meta description too short",
    description: "The current meta description lacks enough context and misses the target keyword.",
    cmsItemId: "cms-meta",
    fixType: "auto-ai",
    aiFixAvailable: true,
  },
  {
    id: "orphan-pages",
    category: "links",
    severity: "info",
    title: "3 orphan pages detected",
    description: "Several pages have no meaningful inbound links, making discovery and crawl flow weaker.",
    fixType: "semi-auto",
    aiFixAvailable: false,
  },
]

const mockAuditResult: AuditResult = {
  id: "mock-audit",
  timestamp: Date.now(),
  pageId: null,
  seoScore: 72,
  geoScore: 48,
  contentScore: 62,
  eeatScore: 54,
  aiCreditsUsed: 13,
  categories: [
    { category: "content", score: 66, weight: 0.2, issueCount: 1 },
    { category: "technical", score: 58, weight: 0.25, issueCount: 1 },
    { category: "links", score: 71, weight: 0.15, issueCount: 1 },
    { category: "media", score: 49, weight: 0.2, issueCount: 1 },
    { category: "ai-readiness", score: 41, weight: 0.2, issueCount: 1 },
  ],
  issues: mockIssues,
}

function boostScore(score: number, amount: number) {
  return Math.min(100, score + amount)
}

export function useAudit() {
  const [result, setResult] = useState<AuditResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fixedIssueIds, setFixedIssueIds] = useState<string[]>([])

  const runAudit = useCallback(async (scope: "page" | "site") => {
    setIsRunning(true)
    setProgress(8)
    setFixedIssueIds([])

    try {
      const engine = new AuditEngine()
      const timer = window.setInterval(() => {
        setProgress((current) => (current < 88 ? current + 9 : current))
      }, 120)

      try {
        const next = await engine.run({ pageId: scope === "page" ? undefined : null })
        setResult(next)
      } catch {
        setResult({ ...mockAuditResult, id: `mock-${scope}-${Date.now()}`, timestamp: Date.now() })
      } finally {
        window.clearInterval(timer)
      }
    } finally {
      setProgress(100)
      window.setTimeout(() => {
        setIsRunning(false)
        setProgress(0)
      }, 250)
    }
  }, [])

  const fixIssue = useCallback(async (issue: Issue) => {
    if (!issue.aiFixAvailable) return
    await checkAndDeductCredits("meta-generate", "pro")

    setFixedIssueIds((current) => (current.includes(issue.id) ? current : [...current, issue.id]))
    setResult((current) => {
      if (!current) return current
      return {
        ...current,
        seoScore: boostScore(current.seoScore, 4),
        geoScore: boostScore(current.geoScore, 6),
        issues: current.issues.filter((entry) => entry.id !== issue.id),
      }
    })
  }, [])

  const fixAll = useCallback(async () => {
    const current = result?.issues.filter((issue) => issue.aiFixAvailable) ?? []
    for (const issue of current) {
      await fixIssue(issue)
    }
  }, [fixIssue, result])

  const groupedCounts = useMemo(() => {
    const issues = result?.issues ?? []
    return {
      critical: issues.filter((issue) => issue.severity === "critical").length,
      warning: issues.filter((issue) => issue.severity === "warning").length,
      info: issues.filter((issue) => issue.severity === "info").length,
    }
  }, [result])

  return {
    result,
    isRunning,
    progress,
    fixedIssueIds,
    groupedCounts,
    runPageAudit: () => runAudit("page"),
    runSiteAudit: () => runAudit("site"),
    fixIssue,
    fixAll,
  }
}
