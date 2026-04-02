import { useState } from "react"
import { Badge, Button, Card, Select, SelectItem } from "@tremor/react"
import { AIButton } from "../components/AIButton"

const schemaObject = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best PM Tools 2026",
  datePublished: "2026-03-15",
  author: "Edo Williams",
  image: "featured.jpg",
  description: "Discover the top project management tools for remote and in-office teams.",
}

export function SchemaTab() {
  const [page, setPage] = useState("current-page")
  const [detectedType, setDetectedType] = useState("Article")
  const [generating, setGenerating] = useState(false)

  const detectSchema = async () => {
    setGenerating(true)
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    setDetectedType("Article")
    setGenerating(false)
  }

  return (
    <div className="space-y-4">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="space-y-3">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Page</div>
            <Select value={page} onValueChange={setPage}>
              <SelectItem value="current-page">Current Page</SelectItem>
              <SelectItem value="blog-pm-tools">/blog/pm-tools</SelectItem>
              <SelectItem value="about">/about</SelectItem>
            </Select>
          </div>
          <AIButton variant="outline" className="w-full" loading={generating} onClick={() => void detectSchema()}>
            AI Detect Schema Type
          </AIButton>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3 text-sm text-zinc-300">
            <span>Detected Type</span>
            <Badge color="green">{detectedType} valid</Badge>
          </div>
        </div>
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Properties</div>
        <div className="space-y-2 text-sm text-zinc-300">
          {Object.entries(schemaObject).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 rounded-xl bg-white/4 px-3 py-2">
              <span className="text-zinc-500">{key}</span>
              <span className="truncate text-right text-zinc-200">{String(value)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">JSON-LD Preview</div>
        <pre className="overflow-auto rounded-xl bg-[#151515] p-4 text-xs leading-5 text-zinc-300">
          {JSON.stringify(schemaObject, null, 2)}
        </pre>
      </Card>

      <Button color="violet" className="w-full justify-center">
        Generate & Inject
      </Button>
    </div>
  )
}
