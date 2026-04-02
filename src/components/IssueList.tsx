import { useMemo, useState } from "react"
import { Badge, Select, SelectItem } from "@tremor/react"
import type { Issue } from "../engine/types"
import { AIButton } from "./AIButton"
import { IssueCard } from "./IssueCard"

export interface IssueListProps {
  issues: Issue[]
  fixedIssueIds?: string[]
  onAIFix: (issue: Issue) => Promise<void> | void
  onFixAll?: () => Promise<void> | void
  onNavigate?: (issue: Issue) => void
}

const severityRank = {
  critical: 0,
  warning: 1,
  info: 2,
} as const

export function IssueList({ issues, fixedIssueIds = [], onAIFix, onFixAll, onNavigate }: IssueListProps) {
  const [sortBy, setSortBy] = useState("severity")
  const fixedSet = new Set(fixedIssueIds)
  const sorted = useMemo(() => {
    const next = [...issues]
    if (sortBy === "title") next.sort((a, b) => a.title.localeCompare(b.title))
    if (sortBy === "severity") next.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    if (sortBy === "category") next.sort((a, b) => a.category.localeCompare(b.category))
    return next
  }, [issues, sortBy])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Issues ({issues.length})</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <Badge color="red">{issues.filter((issue) => issue.severity === "critical").length} critical</Badge>
            <Badge color="yellow">{issues.filter((issue) => issue.severity === "warning").length} warnings</Badge>
            <Badge color="blue">{issues.filter((issue) => issue.severity === "info").length} info</Badge>
          </div>
        </div>
        <AIButton variant="solid" onClick={() => void onFixAll?.()}>
          AI Fix All
        </AIButton>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Sort</span>
        <div className="w-40">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectItem value="severity">Severity</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            fixed={fixedSet.has(issue.id)}
            onAIFix={onAIFix}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}
