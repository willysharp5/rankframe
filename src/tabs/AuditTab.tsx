import { Button, Card } from "@tremor/react"
import { Globe, Search } from "lucide-react"
import { DualScoreBadge } from "../components/DualScoreBadge"
import { EmptyState } from "../components/EmptyState"
import { IssueList } from "../components/IssueList"
import { ProgressBar } from "../components/ProgressBar"
import { navigateToIssue } from "../services/framer-helpers"
import { AIButton } from "../components/AIButton"
import { CreditsBadge } from "../components/CreditsBadge"
import { useAudit } from "../hooks/useAudit"
import { useAICredits } from "../hooks/useAICredits"

export function AuditTab() {
  const audit = useAudit()
  const { credits, total, refresh } = useAICredits("pro")

  const handleFixIssue = async (issue: Parameters<typeof audit.fixIssue>[0]) => {
    await audit.fixIssue(issue)
    await refresh()
  }

  const handleFixAll = async () => {
    await audit.fixAll()
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Button icon={Search} color="blue" className="justify-center" onClick={() => void audit.runPageAudit()}>
          Audit This Page
        </Button>
        <Button
          icon={Globe}
          variant="secondary"
          color="gray"
          className="justify-center"
          onClick={() => void audit.runSiteAudit()}
        >
          Audit Entire Site
        </Button>
      </div>

      {audit.isRunning ? (
        <Card className="border-white/6 bg-[var(--bg-secondary)]">
          <ProgressBar value={audit.progress} color="blue" label="Scan Progress" valueLabel={`${audit.progress}%`} />
        </Card>
      ) : null}

      {!audit.result && !audit.isRunning ? (
        <EmptyState onRunAudit={() => void audit.runPageAudit()} />
      ) : null}

      {audit.result ? (
        <>
          <DualScoreBadge seoScore={audit.result.seoScore} geoScore={audit.result.geoScore} />

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Card className="border-white/6 bg-[var(--bg-secondary)]">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Quick stats</div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-xl bg-white/5 px-2 py-3 text-zinc-300">
                  <div className="text-lg font-semibold text-red-400">{audit.groupedCounts.critical}</div>
                  Critical
                </div>
                <div className="rounded-xl bg-white/5 px-2 py-3 text-zinc-300">
                  <div className="text-lg font-semibold text-yellow-400">{audit.groupedCounts.warning}</div>
                  Warning
                </div>
                <div className="rounded-xl bg-white/5 px-2 py-3 text-zinc-300">
                  <div className="text-lg font-semibold text-blue-400">{audit.groupedCounts.info}</div>
                  Info
                </div>
              </div>
            </Card>
            <CreditsBadge remaining={credits.remaining} total={total} />
          </div>

          <IssueList
            issues={audit.result.issues}
            fixedIssueIds={audit.fixedIssueIds}
            onAIFix={handleFixIssue}
            onFixAll={handleFixAll}
            onNavigate={(issue) => void navigateToIssue(issue)}
          />

          <div className="flex justify-end">
            <AIButton variant="outline">Fix Highest Impact</AIButton>
          </div>
        </>
      ) : null}
    </div>
  )
}
