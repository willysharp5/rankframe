import type { Thing, WithContext } from "schema-dts"
import { z } from "zod"
import { AIService } from "./AIService"
import { AI_PROMPTS } from "./prompts"
import { prepareForAI } from "./nlp"

export const schemaDetectSchema = z.object({
  type: z.string(),
  schema: z.record(z.string(), z.unknown()),
  includeFAQ: z.boolean().default(false),
})

export type DetectedSchemaResult = {
  type: string
  schema: WithContext<Thing> | Record<string, unknown>
  includeFAQ: boolean
}

export async function detectSchema(ai: AIService, pageContent: string, pageUrl?: string): Promise<DetectedSchemaResult> {
  const prepared = prepareForAI(pageContent)
  const result = await ai.generateStructured(
    "schema-detect",
    schemaDetectSchema,
    `Page URL: ${pageUrl ?? "unknown"}
Content summary: ${prepared.summary}
Keywords: ${prepared.keywords.join(", ")}
Entities: ${prepared.entities.join(", ")}`,
    AI_PROMPTS.SCHEMA_DETECT.system,
    AI_PROMPTS.SCHEMA_DETECT.model
  )

  return {
    type: result.type,
    schema: result.schema,
    includeFAQ: result.includeFAQ,
  }
}

