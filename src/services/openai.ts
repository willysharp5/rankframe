import { createOpenAI } from "@ai-sdk/openai"
import { generateText, type ModelMessage } from "ai"

export interface OpenAIServiceConfig {
  apiKey?: string
  useProxy?: boolean
  proxyUrl?: string
  model?: string
}

export interface ChatOptions {
  temperature?: number
  maxOutputTokens?: number
}

type Task<T> = () => Promise<T>

const MAX_CONCURRENT = 5
const BATCH_DELAY_MS = 500
const MAX_RETRIES = 3

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return typeof error === "string" ? error : "Unknown AI service error"
}

function isRateLimitError(error: unknown) {
  const message = toErrorMessage(error)
  return message.includes("429") || message.toLowerCase().includes("rate limit")
}

function isServerError(error: unknown) {
  const message = toErrorMessage(error)
  return message.includes("500") || message.includes("502") || message.includes("503")
}

class RateLimiter {
  private active = 0
  private queue: Array<() => void> = []
  private lastBatchAt = 0

  async schedule<T>(task: Task<T>): Promise<T> {
    await this.acquire()
    try {
      return await task()
    } finally {
      this.release()
    }
  }

  private async acquire(): Promise<void> {
    if (this.active >= MAX_CONCURRENT) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve)
      })
    }

    const now = Date.now()
    const shouldThrottle = this.active % MAX_CONCURRENT === 0 && this.lastBatchAt > 0
    if (shouldThrottle) {
      const waitFor = Math.max(0, BATCH_DELAY_MS - (now - this.lastBatchAt))
      if (waitFor > 0) await sleep(waitFor)
    }

    this.active += 1
    if (this.active % MAX_CONCURRENT === 1) {
      this.lastBatchAt = Date.now()
    }
  }

  private release() {
    this.active = Math.max(0, this.active - 1)
    const next = this.queue.shift()
    next?.()
  }
}

export class OpenAIService {
  private readonly openai
  private readonly limiter = new RateLimiter()
  private readonly defaultModel: string

  constructor(private readonly config: OpenAIServiceConfig = {}) {
    this.defaultModel = config.model ?? "gpt-4o-mini"
    this.openai = createOpenAI({
      apiKey: config.apiKey,
      ...(config.useProxy && config.proxyUrl ? { baseURL: `${config.proxyUrl.replace(/\/$/, "")}/v1` } : {}),
    })
  }

  get isConfigured() {
    return Boolean(this.config.apiKey || (this.config.useProxy && this.config.proxyUrl))
  }

  async chat(messages: ModelMessage[], model = this.defaultModel, options: ChatOptions = {}): Promise<string> {
    if (!this.isConfigured) {
      throw new Error("OpenAI is not configured. Add an API key or enable proxy mode.")
    }

    return this.withRetry(() =>
      this.limiter.schedule(async () => {
        const result = await generateText({
          model: this.openai(model),
          messages,
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxOutputTokens ?? 600,
        })
        return result.text
      })
    )
  }

  async chatJSON<T extends Record<string, unknown> = Record<string, unknown>>(
    messages: ModelMessage[],
    model = this.defaultModel
  ): Promise<T> {
    const text = await this.chat(
      [
        ...messages,
        {
          role: "system",
          content: "Return only valid JSON. Do not wrap it in markdown fences.",
        },
      ],
      model,
      { temperature: 0.2, maxOutputTokens: 800 }
    )

    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error("AI returned invalid JSON.")
    }
  }

  async vision(imageUrl: string, prompt: string, context?: string, model = "gpt-4o-mini"): Promise<string> {
    const messages: ModelMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: context ? `${context}\n\n${prompt}` : prompt,
          },
          {
            type: "image",
            image: new URL(imageUrl),
          },
        ],
      },
    ]

    return this.chat(messages, model, { temperature: 0.2, maxOutputTokens: 500 })
  }

  private async withRetry<T>(task: Task<T>, attempt = 1): Promise<T> {
    try {
      return await task()
    } catch (error) {
      if (isRateLimitError(error) && attempt < MAX_RETRIES) {
        await sleep(500 * attempt)
        return this.withRetry(task, attempt + 1)
      }

      if (isServerError(error)) {
        if (attempt < 2) {
          await sleep(300)
          return this.withRetry(task, attempt + 1)
        }
        throw new Error("OpenAI service is temporarily unavailable. Please try again.")
      }

      throw error instanceof Error ? error : new Error(toErrorMessage(error))
    }
  }
}

export function createOpenAIService(config: OpenAIServiceConfig) {
  return new OpenAIService(config)
}
