import { z } from "zod"
import { AIService } from "./AIService"
import { prepareForAI } from "./nlp"
import { AI_PROMPTS } from "./prompts"

export const metaSchema = z.object({
  title: z.string().max(60),
  description: z.string().max(160),
})

export async function generateMeta(ai: AIService, pageContent: string, keyword: string): Promise<z.infer<typeof metaSchema>> {
  const prepared = prepareForAI(pageContent)
  return ai.generateStructured(
    "meta-generate",
    metaSchema,
    `Keyword: ${keyword}
Content summary: ${prepared.summary}
Keywords: ${prepared.keywords.join(", ")}
Entities: ${prepared.entities.join(", ")}`,
    AI_PROMPTS.META_GENERATE.system,
    AI_PROMPTS.META_GENERATE.model
  )
}

