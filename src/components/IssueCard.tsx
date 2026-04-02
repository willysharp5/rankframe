import { Button, Card } from "@tremor/react"
import { ArrowUpRight, Check, Sparkles } from "lucide-react"
import type { Issue } from "../engine/types"

export interface IssueCardProps {
  issue: Issue
  fixed?: boolean
  onNavigate?: (issue: Issue) => void
  onAIFix?: (issue: Issue) => void | Promise<void>
}

const severityStyles = {
  critical: {
    border: "border-l-red-500",
    dot: "bg-red-500",
  },
  warning: {
    border: "border-l-yellow-500",
    dot: "bg-yellow-500",
  },
  info: {
    border: "border-l-blue-500",
    dot: "bg-blue-500",
  },
} as const

export function IssueCard({ issue, fixed = false, onNavigate, onAIFix }: IssueCardProps) {
  const style = fixed
    ? { border: "border-l-emerald-500", dot: "bg-emerald-500" }
    : severityStyles[issue.severity]

  return (
    <Card
      className={`slide-in border border-white/6 bg-[var(--bg-secondary)] p-4 transition hover:bg-[var(--bg-tertiary)] ${style.border} border-l-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            <span className="truncate">{issue.title}</span>
            {fixed ? <Check className="h-4 w-4 text-emerald-400" /> : null}
          </div>
          <p className="line-clamp-2 text-xs leading-5 text-zinc-400">{issue.description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        {issue.nodeId || issue.cmsItemId ? (
          <Button
            size="xs"
            variant="light"
            color="gray"
            icon={ArrowUpRight}
            onClick={() => onNavigate?.(issue)}
          >
            Go to
          </Button>
        ) : null}
        {issue.aiFixAvailable ? (
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-violet-500/15 bg-violet-500/8 px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-500/15"
            onClick={() => void onAIFix?.(issue)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Fix
          </button>
        ) : null}
      </div>
    </Card>
  )
}
