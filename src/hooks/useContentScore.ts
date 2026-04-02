import { useCallback, useState } from "react"
import type { ContentScoreResult } from "../engine/types"
import { useAIContext } from "../contexts/AIContext"

const defaultResult: ContentScoreResult = {
  score: 62,
  grade: "B-",
  topicCoverage: 65,
  missingTopics: ["Gantt chart", "Agile", "Kanban", "Sprint planning", "Roadmap", "Collaboration"],
  missingEntities: ["Asana", "Jira", "Notion"],
  keywordDensity: 0.3,
  idealKeywordDensity: 1.5,
  wordCount: 800,
  idealWordCount: 2100,
  recommendations: [
    { priority: "high", action: "Add a section comparing Gantt charts and roadmap planning." },
    { priority: "high", action: "Cover Agile and Kanban workflows with concrete examples." },
    { priority: "medium", action: "Expand the article to at least 1,800 words." },
    { priority: "medium", action: "Add a comparison table for teams, pricing, and collaboration use cases." },
  ],
}

export function useContentScore() {
  const { deductCredits } = useAIContext()
  const [keyword, setKeyword] = useState("best project management tools")
  const [selectedItem, setSelectedItem] = useState("blog-pm-tools")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ContentScoreResult | null>(defaultResult)
  const [eeatScore, setEeatScore] = useState(54)

  const analyze = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      await deductCredits("content-score")
      await new Promise((resolve) => window.setTimeout(resolve, 800))
      setResult(defaultResult)
      setEeatScore(54)
    } finally {
      setIsAnalyzing(false)
    }
  }, [deductCredits])

  return {
    keyword,
    setKeyword,
    selectedItem,
    setSelectedItem,
    isAnalyzing,
    result,
    eeatScore,
    analyze,
  }
}
