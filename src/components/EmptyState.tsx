import { Button, Card } from "@tremor/react"
import { Search } from "lucide-react"

export interface EmptyStateProps {
  onRunAudit: () => void
}

export function EmptyState({ onRunAudit }: EmptyStateProps) {
  return (
    <Card className="border-white/6 bg-[var(--bg-secondary)] p-6 text-center text-white">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold">Run your first audit</h3>
      <p className="mt-2 text-xs text-zinc-400">
        Scan this page or the full site to surface SEO and GEO issues, then fix the highest impact items first.
      </p>
      <Button className="mt-4 w-full" color="blue" onClick={onRunAudit}>
        Audit This Page
      </Button>
    </Card>
  )
}
