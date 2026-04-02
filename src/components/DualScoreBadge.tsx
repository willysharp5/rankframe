import { ScoreBadge } from "./ScoreBadge"

export interface DualScoreBadgeProps {
  seoScore: number
  geoScore: number
}

export function DualScoreBadge({ seoScore, geoScore }: DualScoreBadgeProps) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[var(--bg-secondary)] p-4 shadow-panel">
      <div className="grid grid-cols-2 gap-4">
        <ScoreBadge score={seoScore} label="SEO" accentColor="#3b82f6" />
        <ScoreBadge score={geoScore} label="GEO" accentColor="#a855f7" />
      </div>
    </div>
  )
}
