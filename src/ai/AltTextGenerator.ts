import { z } from "zod"
import { AIService } from "./AIService"
import { AI_PROMPTS } from "./prompts"
import { prepareForAI } from "./nlp"
import type { AltTextSuggestion } from "../engine/types"

export const altTextSchema = z.object({
  altText: z.string().max(125),
  rationale: z.string().optional(),
})

export async function generateAltText(
  ai: AIService,
  imageUrl: string,
  pageContext: string,
  surroundingText?: string
): Promise<AltTextSuggestion> {
  const prepared = prepareForAI(`${pageContext}\n${surroundingText ?? ""}`)
  return ai.generateStructured(
    "alt-text",
    altTextSchema,
    `Image URL: ${imageUrl}
Page context: ${pageContext}
Surrounding summary: ${prepared.summary}
Keywords: ${prepared.keywords.join(", ")}
Entities: ${prepared.entities.join(", ")}`,
    AI_PROMPTS.ALT_TEXT.system,
    AI_PROMPTS.ALT_TEXT.model
  )
}

