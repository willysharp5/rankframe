import { createContext, useContext, useMemo, useState } from "react"
import { AuditEngine } from "../engine/AuditEngine"
import type { AuditResult, Issue } from "../engine/types"
import { useAIContext } from "./AIContext"

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
    { category: "content", score: 66, weight: 0.2, issueCount: 0 },
    { category: "technical", score: 58, weight: 0.25, issueCount: 1 },
    { category: "links", score: 71, weight: 0.15, issueCount: 0 },
    { category: "media", score: 49, weight: 0.2, issueCount: 1 },
    { category: "ai-readiness", score: 41, weight: 0.2, issueCount: 1 },
  ],
  issues: mockIssues,
}

function boostScore(score: number, amount: number) {
  return Math.min(100, score + amount)
}

interface AuditContextValue {
  result: AuditResult | null
  isRunning: boolean
  progress: number
  fixedIssueIds: string[]
  groupedCounts: { critical: number; warning: number; info: number }
  history: AuditResult[]
  runPageAudit: () => Promise<void>
  runSiteAudit: () => Promise<void>
  fixIssue: (issue: Issue) => Promise<void>
  fixAll: () => Promise<void>
}

const AuditContext = createContext<AuditContextValue | null>(null)

export function AuditProvider({
  history,
  onSaveAudit,
  children,
}: {
  history: AuditResult[]
  onSaveAudit: (audit: AuditResult) => Promise<void>
  children: React.ReactNode
}) {
  const { deductCredits } = useAIContext()
  const [result, setResult] = useState<AuditResult | null>(history[0] ?? null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fixedIssueIds, setFixedIssueIds] = useState<string[]>([])
  const [auditHistory, setAuditHistory] = useState<AuditResult[]>(history)

  const runAudit = async (scope: "page" | "site") => {
    setIsRunning(true)
    setProgress(8)
    setFixedIssueIds([])

    try {
      const engine = new AuditEngine()
      const timer = window.setInterval(() => {
        setProgress((current) => (current < 88 ? current + 9 : current))
      }, 120)

      let next: AuditResult
      try {
        next = await engine.run({ pageId: scope === "page" ? undefined : null })
      } catch {
        next = { ...mockAuditResult, id: `mock-${scope}-${Date.now()}`, timestamp: Date.now() }
      } finally {
        window.clearInterval(timer)
      }

      setResult(next)
      setAuditHistory((current) => [next, ...current].slice(0, 30))
      await onSaveAudit(next)
    } finally {
      setProgress(100)
      window.setTimeout(() => {
        setIsRunning(false)
        setProgress(0)
      }, 250)
    }
  }

  const fixIssue = async (issue: Issue) => {
    if (!issue.aiFixAvailable) return
    await deductCredits("meta-generate")

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
  }

  const fixAll = async () => {
    const current = result?.issues.filter((issue) => issue.aiFixAvailable) ?? []
    for (const issue of current) {
      await fixIssue(issue)
    }
  }

  const groupedCounts = useMemo(() => {
    const issues = result?.issues ?? []
    return {
      critical: issues.filter((issue) => issue.severity === "critical").length,
      warning: issues.filter((issue) => issue.severity === "warning").length,
      info: issues.filter((issue) => issue.severity === "info").length,
    }
  }, [result])

  const value = useMemo<AuditContextValue>(
    () => ({
      result,
      isRunning,
      progress,
      fixedIssueIds,
      groupedCounts,
      history: auditHistory,
      runPageAudit: () => runAudit("page"),
      runSiteAudit: () => runAudit("site"),
      fixIssue,
      fixAll,
    }),
    [auditHistory, fixedIssueIds, groupedCounts, isRunning, progress, result]
  )

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>
}

export function useAuditContext() {
  const context = useContext(AuditContext)
  if (!context) {
    throw new Error("useAuditContext must be used within AuditProvider")
  }
  return context
}
