import { framer } from "framer-plugin"
import type { CheckResult } from "../types"

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function countSentences(text: string): number {
  const matches = text.match(/[.!?]+/g)
  return matches?.length ?? 0
}

function countSyllables(word: string): number {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "")
  if (!normalized) return 0
  const groups = normalized.match(/[aeiouy]+/g)
  return Math.max(1, groups?.length ?? 1)
}

function readabilityScore(text: string): number {
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length || 1
  const sentenceCount = countSentences(text) || 1
  const syllableCount = words.reduce((total, word) => total + countSyllables(word), 0)
  return 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
}

export async function analyzeContent(): Promise<CheckResult[]> {
  const textNodes = await framer.getNodesWithType("TextNode")
  const texts = await Promise.all(textNodes.map((node) => node.getText()))
  const fullText = texts.filter((value): value is string => Boolean(value)).join(" ")
  const words = countWords(fullText)
  const readability = readabilityScore(fullText)

  const results: CheckResult[] = []

  if (words < 300) {
    results.push({
      checkId: "content-word-count-low",
      category: "content",
      status: "warning",
      weight: 0.75,
      message: `Only ${words} words detected on the page.`,
      affectedNodes: [],
      issue: {
        id: "content-word-count-low",
        category: "content",
        severity: "warning",
        title: "Thin content",
        description: "Pages with fewer than 300 words often struggle to rank competitively.",
        fixType: "manual",
        aiFixAvailable: true,
      },
      metadata: { wordCount: words },
    })
  }

  if (readability < 45) {
    results.push({
      checkId: "content-readability-low",
      category: "content",
      status: "warning",
      weight: 0.75,
      message: `Content readability is low (${Math.round(readability)}).`,
      affectedNodes: [],
      issue: {
        id: "content-readability-low",
        category: "content",
        severity: "warning",
        title: "Low readability",
        description: "The content may be difficult to scan quickly.",
        fixType: "manual",
        aiFixAvailable: false,
      },
      metadata: { readability },
    })
  }

  if (results.length === 0) {
    results.push({
      checkId: "content-quality-ok",
      category: "content",
      status: "pass",
      weight: 1,
      message: `Content length and readability look healthy (${words} words).`,
      affectedNodes: [],
      metadata: { wordCount: words, readability },
    })
  }

  return results
}

