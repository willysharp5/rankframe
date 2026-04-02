import winkNLP from "wink-nlp"
import model from "wink-eng-lite-web-model"

const nlp = winkNLP(model)
const its = nlp.its
const as = nlp.as

export function extractKeywords(text: string): string[] {
  const doc = nlp.readDoc(text)
  return doc
    .tokens()
    .filter((token) => token.out(its.type) === "word" && !token.out(its.stopWordFlag))
    .out(its.normal, as.freqTable)
    .slice(0, 20)
    .map(([word]) => String(word))
}

export function extractEntities(text: string): string[] {
  const doc = nlp.readDoc(text)
  return doc
    .entities()
    .out(its.detail)
    .map((entity) => (typeof entity === "string" ? entity : String(entity.value)))
}

export function keywordDensity(text: string, keyword: string): number {
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 0
  const keywordTokens = keyword.toLowerCase().split(/\s+/)
  const matches = tokens.filter((token) => keywordTokens.includes(token)).length
  return matches / tokens.length
}

export function sentenceCount(text: string): number {
  return nlp.readDoc(text).sentences().length()
}

export function prepareForAI(fullText: string): {
  keywords: string[]
  entities: string[]
  sentenceCount: number
  wordCount: number
  summary: string
} {
  const words = fullText.split(/\s+/).filter(Boolean)
  return {
    keywords: extractKeywords(fullText),
    entities: extractEntities(fullText),
    sentenceCount: sentenceCount(fullText),
    wordCount: words.length,
    summary: words.slice(0, 500).join(" "),
  }
}
