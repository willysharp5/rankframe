import { createOpenAI } from "@ai-sdk/openai"
import { generateObject, generateText as sdkGenerateText, streamText } from "ai"
import { z } from "zod"
import { checkAndDeductCredits, type AIFeature, type BillingTier } from "./credits"

export interface AIServiceConfig {
  apiKey: string
  tier?: BillingTier
  useProxy?: boolean
  proxyUrl?: string
}

export class AIService {
  private readonly openai
  private readonly tier: BillingTier

  constructor(config: AIServiceConfig) {
    this.openai = createOpenAI({
      apiKey: config.apiKey,
      ...(config.useProxy && config.proxyUrl ? { baseURL: `${config.proxyUrl.replace(/\/$/, "")}/v1` } : {}),
    })
    this.tier = config.tier ?? "free"
  }

  async generateStructured<T>(
    feature: AIFeature,
    schema: z.ZodType<T>,
    prompt: string,
    systemPrompt: string,
    model = "gpt-4o-mini"
  ): Promise<T> {
    await checkAndDeductCredits(feature, this.tier)
    const { object } = await generateObject({
      model: this.openai(model),
      schema,
      system: systemPrompt,
      prompt,
      temperature: 0.3,
    })
    return object
  }

  async generateText(
    feature: AIFeature,
    prompt: string,
    systemPrompt: string,
    model = "gpt-4o-mini"
  ): Promise<string> {
    await checkAndDeductCredits(feature, this.tier)
    const { text } = await sdkGenerateText({
      model: this.openai(model),
      system: systemPrompt,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 300,
    })
    return text
  }

  async generateStream(
    feature: AIFeature,
    prompt: string,
    systemPrompt: string,
    onChunk: (chunk: string) => void,
    model = "gpt-4o-mini"
  ): Promise<string> {
    await checkAndDeductCredits(feature, this.tier)
    const result = streamText({
      model: this.openai(model),
      system: systemPrompt,
      prompt,
      temperature: 0.3,
    })

    let fullText = ""
    for await (const chunk of result.textStream) {
      fullText += chunk
      onChunk(chunk)
    }
    return fullText
  }
}
