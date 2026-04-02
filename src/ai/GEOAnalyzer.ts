import { z } from "zod"
import { AIService } from "./AIService"
import { prepareForAI } from "./nlp"
import { AI_PROMPTS } from "./prompts"
import type { GEOScoreResult } from "../engine/types"

export const geoScoreSchema = z.object({
  geoScore: z.number().min(0).max(100),
  dimensions: z.object({
    definitions: z.object({ score: z.number().min(0).max(100), issues: z.array(z.string()) }),
    qaStructure: z.object({ score: z.number().min(0).max(100), issues: z.array(z.string()) }),
    citations: z.object({ score: z.number().min(0).max(100), issues: z.array(z.string()) }),
    structuredData: z.object({ score: z.number().min(0).max(100), issues: z.array(z.string()) }),
    authority: z.object({ score: z.number().min(0).max(100), issues: z.array(z.string()) }),
    organization: z.object({ score: z.number().min(0).max(100), issues: z.array(z.string()) }),
  }),
  recommendations: z.array(z.string()),
})

export async function analyzeGEOWithAI(ai: AIService, content: string, context?: string): Promise<GEOScoreResult> {
  const prepared = prepareForAI(content)
  return ai.generateStructured(
    "geo-score",
    geoScoreSchema,
    `Context: ${context ?? "none"}
Summary: ${prepared.summary}
Keywords: ${prepared.keywords.join(", ")}
Entities: ${prepared.entities.join(", ")}`,
    AI_PROMPTS.GEO_SCORE.system,
    AI_PROMPTS.GEO_SCORE.model
  )
}

