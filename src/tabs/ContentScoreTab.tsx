import { Callout, Card, SearchSelect, SearchSelectItem, TextInput } from "@tremor/react"
import { Bot, FileText } from "lucide-react"
import { ProgressBar } from "../components/ProgressBar"
import { useContentScore } from "../hooks/useContentScore"
import { AIButton } from "../components/AIButton"
import { useAICredits } from "../hooks/useAICredits"

const cmsItems = [
  { id: "blog-pm-tools", label: "Best PM Tools 2026" },
  { id: "blog-seo-guide", label: "Framer SEO Guide" },
  { id: "case-study-acme", label: "Acme Case Study" },
]

export function ContentScoreTab() {
  const content = useContentScore()
  const { refresh } = useAICredits("pro")

  const handleAnalyze = async () => {
    await content.analyze()
    await refresh()
  }

  return (
    <div className="space-y-4">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="space-y-3">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Page</div>
            <SearchSelect value={content.selectedItem} onValueChange={content.setSelectedItem} icon={FileText}>
              {cmsItems.map((item) => (
                <SearchSelectItem key={item.id} value={item.id}>
                  {item.label}
                </SearchSelectItem>
              ))}
            </SearchSelect>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Keyword</div>
            <TextInput value={content.keyword} onValueChange={content.setKeyword} />
          </div>
          <AIButton variant="solid" className="w-full" loading={content.isAnalyzing} onClick={() => void handleAnalyze()}>
            Analyze Content
          </AIButton>
        </div>
      </Card>

      {content.result ? (
        <>
          <Card className="border-white/6 bg-[var(--bg-secondary)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Content Score</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-semibold text-white">{content.result.score}</span>
                  <span className="pb-1 text-lg text-zinc-400">/100</span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-zinc-300">{content.result.grade}</span>
                </div>
              </div>
              <div className="rounded-xl border border-violet-500/15 bg-violet-500/8 px-3 py-2 text-xs text-violet-200">
                <div className="mb-1 flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5" />
                  AI-Powered
                </div>
                Target: {content.keyword}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <ProgressBar value={content.result.score} color="yellow" />
              <ProgressBar
                value={content.result.topicCoverage}
                color="purple"
                label="Topic Coverage"
                valueLabel={`${content.result.topicCoverage}%`}
              />
              <ProgressBar
                value={(content.result.wordCount / content.result.idealWordCount) * 100}
                color="blue"
                label="Word Count"
                valueLabel={`${content.result.wordCount}/${content.result.idealWordCount}`}
              />
              <ProgressBar
                value={(content.result.keywordDensity / content.result.idealKeywordDensity) * 100}
                color="green"
                label="Keyword Density"
                valueLabel={`${content.result.keywordDensity}%/${content.result.idealKeywordDensity}%`}
              />
            </div>
          </Card>

          <Card className="border-white/6 bg-[var(--bg-secondary)]">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Missing Topics</div>
            <div className="flex flex-wrap gap-2">
              {content.result.missingTopics.map((topic) => (
                <button
                  key={topic}
                  className="rounded-full bg-white/6 px-3 py-1.5 text-xs text-zinc-300 transition hover:scale-[1.02] hover:bg-white/10"
                  onClick={() => void navigator.clipboard?.writeText(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-white/6 bg-[var(--bg-secondary)]">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Recommendations</div>
            <div className="space-y-2">
              {content.result.recommendations.map((recommendation) => (
                <Callout
                  key={recommendation.action}
                  title={recommendation.priority === "high" ? "High Priority" : "Recommendation"}
                  color={recommendation.priority === "high" ? "red" : "yellow"}
                >
                  {recommendation.action}
                </Callout>
              ))}
            </div>
          </Card>

          <Card className="border-white/6 bg-[var(--bg-secondary)]">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">E-E-A-T Score</div>
            <ProgressBar value={content.eeatScore} color="yellow" valueLabel={`${content.eeatScore}/100`} />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              {[
                ["Experience", 58],
                ["Expertise", 64],
                ["Authority", 42],
                ["Trust", 71],
              ].map(([label, value]) => (
                <ProgressBar key={label} label={label} value={Number(value)} color="purple" />
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
