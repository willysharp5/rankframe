import { Badge, Button, Card } from "@tremor/react"
import { Lock } from "lucide-react"
import type { LicenseTier } from "../services/license"

export function LicenseGate({
  tier,
  title,
  description,
}: {
  tier: LicenseTier
  title: string
  description: string
}) {
  return (
    <Card className="border-white/6 bg-[var(--bg-secondary)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Lock className="h-4 w-4 text-amber-300" />
            {title}
          </div>
          <p className="mt-2 text-sm text-zinc-400">{description}</p>
        </div>
        <Badge color={tier === "free" ? "yellow" : "green"}>{tier}</Badge>
      </div>
      <Button color="gray" variant="secondary" className="mt-4 w-full justify-center">
        Upgrade to Pro
      </Button>
    </Card>
  )
}
