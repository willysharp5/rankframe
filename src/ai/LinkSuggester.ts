import { z } from "zod"
import { AIService } from "./AIService"
import { AI_PROMPTS } from "./prompts"
import type { LinkSuggestion } from "../engine/types"

export const linkSuggestionSchema = z.array(
  z.object({
    sourcePageId: z.string(),
    sourcePagePath: z.string(),
    anchorText: z.string(),
    targetPageId: z.string(),
    targetPagePath: z.string(),
    relevanceScore: z.number().min(0).max(100),
    rationale: z.string(),
  })
)

export interface LinkSuggestionInput {
  pageId: string
  path: string
  summary: string
}

export async function suggestInternalLinks(ai: AIService, pages: LinkSuggestionInput[]): Promise<LinkSuggestion[]> {
  return ai.generateStructured(
    "internal-links",
    linkSuggestionSchema,
    `Pages:\n${JSON.stringify(pages, null, 2)}`,
    AI_PROMPTS.INTERNAL_LINKS.system,
    AI_PROMPTS.INTERNAL_LINKS.model
  )
}

