import { useEffect, useMemo, useState } from "react"

export interface ScoreBadgeProps {
  score: number
  label: string
  accentColor?: string
  size?: number
}

function getScoreTone(score: number): { text: string; color: string } {
  if (score >= 80) return { text: "Excellent", color: "#22c55e" }
  if (score >= 70) return { text: "Good", color: "#84cc16" }
  if (score >= 50) return { text: "Needs Work", color: "#eab308" }
  if (score >= 30) return { text: "Poor", color: "#f97316" }
  return { text: "Critical", color: "#ef4444" }
}

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) * (1 - progress)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    setValue(0)
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, target])

  return value
}

export function ScoreBadge({ score, label, accentColor, size = 122 }: ScoreBadgeProps) {
  const animatedScore = useCountUp(score)
  const radius = useMemo(() => (size - 20) / 2, [size])
  const circumference = 2 * Math.PI * radius
  const tone = getScoreTone(score)
  const progress = circumference - (animatedScore / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            className="score-ring-track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="9"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tone.color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            style={{ transition: "stroke-dashoffset 180ms ease-out, stroke 180ms ease-out" }}
          />
          {accentColor ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray={`${circumference * 0.08} ${circumference}`}
              strokeLinecap="round"
              opacity={0.7}
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-semibold tracking-tight text-white">{animatedScore}</div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">/100</div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-300">
            {label}
          </div>
        </div>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tone.color }} />
        {tone.text}
      </div>
    </div>
  )
}
