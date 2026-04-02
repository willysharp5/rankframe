import { z } from "zod"
import { AIService } from "./AIService"
import { AI_PROMPTS } from "./prompts"
import type { HeadingRewriteResult } from "../engine/types"

export const headingRewriteSchema = z.object({
  original: z.string(),
  rewritten: z.string(),
  reasoning: z.string(),
})

export async function rewriteHeading(
  ai: AIService,
  original: string,
  targetKeyword: string,
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
): Promise<HeadingRewriteResult> {
  return ai.generateStructured(
    "heading-rewrite",
    headingRewriteSchema,
    `Original heading: ${original}
Target keyword: ${targetKeyword}
Heading level: ${level}`,
    AI_PROMPTS.HEADING_REWRITE.system,
    AI_PROMPTS.HEADING_REWRITE.model
  )
}

