import { Bot } from "lucide-react"
import { ProgressBar } from "./ProgressBar"

export interface CreditsBadgeProps {
  remaining: number
  total: number
}

export function CreditsBadge({ remaining, total }: CreditsBadgeProps) {
  const percent = total === 0 ? 0 : Math.max(0, Math.min(100, (remaining / total) * 100))
  const color = percent <= 5 ? "red" : percent <= 10 ? "yellow" : "purple"

  return (
    <div className="min-w-[148px] rounded-xl border border-violet-500/15 bg-violet-500/8 px-3 py-2">
      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-200">
        <Bot className="h-3.5 w-3.5 text-violet-300" />
        <span>
          {remaining} / {total} credits
        </span>
      </div>
      <ProgressBar value={percent} color={color} />
    </div>
  )
}
