import { z } from "zod"
import { AIService } from "./AIService"
import { prepareForAI } from "./nlp"
import { AI_PROMPTS } from "./prompts"
import type { EEATScoreResult } from "../engine/types"

export const eeatSchema = z.object({
  eeatScore: z.number().min(0).max(100),
  experience: z.object({
    score: z.number().min(0).max(100),
    signals: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  expertise: z.object({
    score: z.number().min(0).max(100),
    signals: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  authoritativeness: z.object({
    score: z.number().min(0).max(100),
    signals: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  trustworthiness: z.object({
    score: z.number().min(0).max(100),
    signals: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  recommendations: z.array(z.string()),
})

export async function analyzeEEATWithAI(ai: AIService, content: string, context?: string): Promise<EEATScoreResult> {
  const prepared = prepareForAI(content)
  return ai.generateStructured(
    "eeat-check",
    eeatSchema,
    `Context: ${context ?? "none"}
Summary: ${prepared.summary}
Keywords: ${prepared.keywords.join(", ")}
Entities: ${prepared.entities.join(", ")}`,
    AI_PROMPTS.EEAT_CHECK.system,
    AI_PROMPTS.EEAT_CHECK.model
  )
}

