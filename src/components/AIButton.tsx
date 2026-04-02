import { forwardRef } from "react"
import { Sparkles } from "lucide-react"

type AIButtonVariant = "ghost" | "solid" | "outline"

export interface AIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AIButtonVariant
  loading?: boolean
  icon?: boolean
}

const variantClasses: Record<AIButtonVariant, string> = {
  ghost:
    "border border-transparent bg-transparent text-violet-300 hover:bg-violet-500/10",
  solid:
    "border border-violet-500/80 bg-violet-500/90 text-white hover:bg-violet-400",
  outline:
    "border border-violet-500/60 bg-transparent text-violet-200 hover:bg-violet-500/10",
}

export const AIButton = forwardRef<HTMLButtonElement, AIButtonProps>(function AIButton(
  { className = "", variant = "ghost", loading = false, icon = true, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`ai-shimmer inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${variantClasses[variant]} ${loading ? "opacity-90" : ""} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      {...props}
    >
      {icon ? <Sparkles className="h-3.5 w-3.5" /> : null}
      <span>{loading ? "Processing..." : children}</span>
    </button>
  )
})
