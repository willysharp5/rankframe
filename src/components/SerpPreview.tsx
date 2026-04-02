export interface SerpPreviewProps {
  title: string
  url: string
  description: string
}

function getCounterTone(value: number, max: number) {
  if (value === 0) return "text-red-400"
  if (value > max) return "text-yellow-400"
  return "text-emerald-400"
}

export function SerpPreview({ title, url, description }: SerpPreviewProps) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#171717] p-4">
      <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
        Google Preview
      </div>
      <div className="space-y-1">
        <div className="line-clamp-2 text-base leading-5 text-[#8ab4f8]">{title || "Missing title"}</div>
        <div className="line-clamp-1 text-xs text-[#bdc1c6]">{url}</div>
        <div className="line-clamp-3 text-sm leading-5 text-zinc-400">
          {description || "Add a meta description to improve CTR and search context."}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs">
        <span className={getCounterTone(title.length, 60)}>Title: {title.length}/60</span>
        <span className={getCounterTone(description.length, 160)}>Desc: {description.length}/160</span>
      </div>
    </div>
  )
}
