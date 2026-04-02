import { Card } from "@tremor/react"
import { ArrowRight, Link2 } from "lucide-react"
import { AIButton } from "../components/AIButton"

const orphans = [
  { path: "/blog/old-post", inbound: 0, outbound: 2 },
  { path: "/privacy", inbound: 0, outbound: 0 },
  { path: "/case-study-acme", inbound: 0, outbound: 1 },
]

const suggestions = [
  {
    anchor: "project management",
    source: "/blog",
    target: "/tools",
    confidence: 95,
  },
  {
    anchor: "our methodology",
    source: "/about",
    target: "/blog/agile",
    confidence: 88,
  },
]

export function LinksTab() {
  return (
    <div className="space-y-4">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Internal Link Analysis</div>
            <div className="text-xs text-zinc-500">45 pages scanned</div>
          </div>
          <AIButton variant="solid">AI Suggest Links</AIButton>
        </div>
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Orphan Pages</div>
        <div className="space-y-2">
          {orphans.map((page) => (
            <div key={page.path} className="flex items-center justify-between rounded-xl bg-white/4 px-3 py-3 text-sm">
              <div>
                <div className="text-red-300">{page.path}</div>
                <div className="text-xs text-zinc-500">
                  {page.inbound} inbound • {page.outbound} outbound
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">AI Suggestions (47)</div>
          <AIButton variant="outline">Add All High-Confidence</AIButton>
        </div>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={`${suggestion.anchor}-${suggestion.target}`} className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm text-zinc-200">
                <Link2 className="h-4 w-4 text-violet-300" />
                <span>"{suggestion.anchor}" on {suggestion.source}</span>
              </div>
              <div className="text-xs text-zinc-500">
                Link to {suggestion.target} ({suggestion.confidence}% match)
              </div>
              <div className="mt-3">
                <AIButton variant="ghost">Add Link</AIButton>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
