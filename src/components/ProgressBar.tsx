import { ProgressBar as TremorProgressBar } from "@tremor/react"

export interface ProgressBarProps {
  value: number
  color?: "blue" | "purple" | "green" | "yellow" | "red" | "orange"
  label?: string
  valueLabel?: string
}

export function ProgressBar({ value, color = "blue", label, valueLabel }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      {label || valueLabel ? (
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-300">{label}</span>
          <span className="text-zinc-500">{valueLabel}</span>
        </div>
      ) : null}
      <TremorProgressBar value={value} color={color} className="[&>div]:bg-white/8" />
    </div>
  )
}
