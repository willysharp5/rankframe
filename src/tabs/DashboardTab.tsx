import { AreaChart, BarList, Card } from "@tremor/react"
import { DualScoreBadge } from "../components/DualScoreBadge"
import { AIButton } from "../components/AIButton"
import { CreditsBadge } from "../components/CreditsBadge"
import { useAudit } from "../hooks/useAudit"
import { useAICredits } from "../hooks/useAICredits"

const history = [
  { date: "Mar 1", SEO: 46, GEO: 28 },
  { date: "Mar 8", SEO: 53, GEO: 34 },
  { date: "Mar 15", SEO: 61, GEO: 39 },
  { date: "Mar 22", SEO: 67, GEO: 45 },
  { date: "Mar 30", SEO: 72, GEO: 48 },
]

const pageScores = [
  { name: "/features", value: 92 },
  { name: "/about", value: 78 },
  { name: "/pricing", value: 68 },
  { name: "/blog/post-1", value: 34 },
]

export function DashboardTab() {
  const audit = useAudit()
  const { credits, total } = useAICredits("pro")
  const result = audit.result ?? {
    seoScore: 72,
    geoScore: 48,
    issues: [
      { severity: "critical" },
      { severity: "critical" },
      { severity: "critical" },
      { severity: "warning" },
      { severity: "warning" },
      { severity: "warning" },
      { severity: "warning" },
      { severity: "warning" },
      { severity: "warning" },
      { severity: "warning" },
      { severity: "info" },
      { severity: "info" },
      { severity: "info" },
      { severity: "info" },
    ],
  }

  return (
    <div className="space-y-4">
      <DualScoreBadge seoScore={result.seoScore} geoScore={result.geoScore} />

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Score History</div>
        <AreaChart
          className="h-48"
          data={history}
          index="date"
          categories={["SEO", "GEO"]}
          colors={["blue", "purple"]}
          showLegend
          showGridLines={false}
          showGradient
          yAxisWidth={28}
        />
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Issue Mix</div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-300">
            {result.issues.filter((issue) => issue.severity === "critical").length} critical
          </span>
          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-yellow-300">
            {result.issues.filter((issue) => issue.severity === "warning").length} warning
          </span>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-blue-300">
            {result.issues.filter((issue) => issue.severity === "info").length} info
          </span>
        </div>
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Pages by Score</div>
        <BarList data={pageScores} color="blue" className="[&_span]:text-zinc-200" />
      </Card>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <AIButton variant="solid" className="justify-center">
          Fix Highest Impact
        </AIButton>
        <CreditsBadge remaining={credits.remaining} total={total} />
      </div>
    </div>
  )
}
