import { z } from "zod"
import { AIService } from "./AIService"
import { AI_PROMPTS } from "./prompts"
import type { ContentBriefResult } from "../engine/types"

export const contentBriefSchema = z.object({
  keyword: z.string(),
  contentType: z.string(),
  targetWordCount: z.object({
    min: z.number(),
    ideal: z.number(),
    max: z.number(),
  }),
  suggestedTitle: z.string(),
  suggestedHeadings: z.array(
    z.object({
      level: z.enum(["h2", "h3"]),
      text: z.string(),
    })
  ),
  requiredTopics: z.array(z.string()),
  requiredEntities: z.array(z.string()),
  questionsToAnswer: z.array(z.string()),
  competitorInsights: z.array(
    z.object({
      url: z.string(),
      strength: z.string(),
      weakness: z.string(),
    })
  ),
  toneGuidance: z.string(),
  internalLinkOpportunities: z.array(z.string()),
})

export async function generateContentBrief(
  ai: AIService,
  keyword: string,
  serpAnalysis: string,
  onChunk?: (chunk: string) => void
): Promise<ContentBriefResult | string> {
  if (onChunk) {
    return ai.generateStream(
      "content-brief",
      `Keyword: ${keyword}\nSERP analysis: ${serpAnalysis}`,
      AI_PROMPTS.CONTENT_BRIEF.system,
      onChunk,
      AI_PROMPTS.CONTENT_BRIEF.model
    )
  }

  return ai.generateStructured(
    "content-brief",
    contentBriefSchema,
    `Keyword: ${keyword}\nSERP analysis: ${serpAnalysis}`,
    AI_PROMPTS.CONTENT_BRIEF.system,
    AI_PROMPTS.CONTENT_BRIEF.model
  )
}

