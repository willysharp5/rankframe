import { z } from "zod"
import { AIService } from "./AIService"
import { prepareForAI } from "./nlp"
import { AI_PROMPTS } from "./prompts"
import type { ContentScoreResult } from "../engine/types"

export const contentScoreSchema = z.object({
  score: z.number().min(0).max(100),
  grade: z.string(),
  topicCoverage: z.number().min(0).max(100),
  missingTopics: z.array(z.string()),
  missingEntities: z.array(z.string()),
  keywordDensity: z.number().min(0),
  idealKeywordDensity: z.number().min(0),
  wordCount: z.number().min(0),
  idealWordCount: z.number().min(0),
  recommendations: z.array(
    z.object({
      priority: z.enum(["high", "medium", "low"]),
      action: z.string(),
    })
  ),
})

export async function scoreContent(
  ai: AIService,
  content: string,
  keyword: string,
  competitorSummaries: string
): Promise<ContentScoreResult> {
  const prepared = prepareForAI(content)
  return ai.generateStructured(
    "content-score",
    contentScoreSchema,
    `Target keyword: ${keyword}
Local NLP summary: ${JSON.stringify(prepared)}
Content: ${prepared.summary}
Competitor summaries: ${competitorSummaries}`,
    AI_PROMPTS.CONTENT_SCORE.system,
    AI_PROMPTS.CONTENT_SCORE.model
  )
}

