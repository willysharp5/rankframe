# Framer SEO Power Tool — Technical Plan

**Version:** 2.0 (AI-Enhanced)
**Date:** March 29, 2026
**Status:** Ready for Development
**Updated:** AI-first architecture — Content Score, GEO Score, AI meta generation, smart schema, AI internal links

---

## 1. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript (strict mode) | Type safety, better DX, Framer SDK is TS-native |
| **UI Framework** | React 18+ | Framer plugins run as React apps in a floating panel |
| **Plugin SDK** | `framer-plugin` (npm) | Official SDK — provides `framer.*` APIs for Nodes, CMS, Sites, Assets, Code Files |
| **Build Tool** | Vite | Default for `npm create framer-plugin@latest`, fast HMR |
| **Styling** | CSS Modules + Framer's built-in plugin styles | Match Framer editor look & feel |
| **UI Components** | Tremor (tremor.so) — React chart/dashboard components | Score rings, area charts, bar lists, progress bars, stat cards, data tables. Copy-paste Tailwind CSS components adapted for dark mode. |
| **AI Integration** | OpenAI API (GPT-4o-mini for text, GPT-4o for vision) | Alt text, meta generation, content scoring, schema detection, internal link suggestions, GEO analysis, E-E-A-T checks |
| **NLP/Text Analysis** | Custom TF-IDF + entity extraction (lightweight, browser-safe) | Content scoring, topic coverage, keyword density — no heavy NLP deps |
| **AI SDK** | Vercel AI SDK (`ai` npm package) — optional | Streaming AI responses for content briefs, structured output parsing |
| **HTTP Client** | Native `fetch` | Plugin runs in browser sandbox, no need for axios |
| **State Management** | React Context + useReducer | Lightweight, no external deps needed for plugin scope |
| **Storage** | Plugin Data API (`framer.setPluginData` / `localStorage`) | Persist audit history, user prefs, API keys |
| **Payment** | Stripe (external) | Subscription validation via license key check |
| **Schema Validation** | Custom JSON-LD validator | Validate against Google Rich Results format |
| **Testing** | Vitest + React Testing Library | Fast, Vite-native test runner |

### Key Dependencies (package.json)

```json
{
  "dependencies": {
    "framer-plugin": "latest",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "ai": "^6.0.0",
    "@ai-sdk/openai": "^1.0.0",
    "zod": "^4.0.0",
    "wink-nlp": "^2.4.0",
    "wink-eng-lite-web-model": "^1.0.0",
    "schema-dts": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@types/react": "^18.0.0",
    "vitest": "^1.0.0"
  }
}
```

### Dependency Rationale

| Package | Size | Why |
|---------|------|-----|
| `ai` (Vercel AI SDK) | tree-shakeable | `generateObject()` with Zod schemas — structured AI output, no manual JSON parsing. Provider-agnostic. Streaming support for content briefs. |
| `@ai-sdk/openai` | small | OpenAI provider for Vercel AI SDK. Handles auth, retries, rate limiting. |
| `zod` | ~13KB gzipped | Type-safe validation for all AI responses + user inputs. Required by `generateObject()`. |
| `wink-nlp` | ~10KB gzipped | Browser-safe NLP: keyword extraction, entity detection, sentence segmentation, word embeddings (100d). 650K tokens/sec on M1. Preprocesses content locally before sending to OpenAI (50-70% fewer tokens). |
| `wink-eng-lite-web-model` | ~2MB (loaded async) | English language model for wink-nlp. Loaded on demand, not at plugin startup. |
| `schema-dts` | 0 runtime | TypeScript types for Schema.org schemas. Compile-time only — zero bundle impact. Auto-complete for JSON-LD properties. |

**Lean philosophy:** 6 new packages, all justified. wink-nlp handles local NLP so we send less data to OpenAI ($$ savings). Vercel AI SDK replaces manual fetch/parse code with type-safe structured output. No UI framework — CSS modules match Framer's editor. Every KB still matters.

---

## 2. Architecture Overview

### How Framer Plugins Work

Framer plugins are React applications that run inside a sandboxed iframe within the Framer editor. They communicate with the editor via the `framer` global API object provided by `framer-plugin`.

```
┌─────────────────────────────────────────────────┐
│                 FRAMER EDITOR                    │
│                                                  │
│  ┌──────────────┐    ┌────────────────────────┐ │
│  │   Canvas     │    │   Plugin Panel (iframe) │ │
│  │              │    │                         │ │
│  │  [Nodes]     │◄──►│  React App              │ │
│  │  [Pages]     │    │  ├─ Audit Engine        │ │
│  │  [CMS]       │    │  ├─ AI Service Layer    │ │
│  │              │    │  ├─ Content Score (NLP) │ │
│  │              │    │  ├─ Meta Editor + AI    │ │
│  │              │    │  ├─ Schema AI Gen       │ │
│  │              │    │  ├─ AI Link Genius      │ │
│  │              │    │  ├─ GEO Analyzer        │ │
│  │              │    │  ├─ E-E-A-T Checker     │ │
│  │              │    │  └─ Dashboard           │ │
│  └──────────────┘    └────────────────────────┘ │
│         │                      │                 │
│         ▼                      ▼                 │
│  ┌──────────────┐    ┌────────────────────────┐ │
│  │ framer API   │    │  External APIs          │ │
│  │ (Nodes,CMS,  │    │  ├─ OpenAI (all AI)    │ │
│  │  Sites,Code  │    │  ├─ SERP API (scoring) │ │
│  │  Files,Nav)  │    │  ├─ Stripe (license)   │ │
│  │              │    │  └─ Our Backend (proxy) │ │
│  └──────────────┘    └────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Plugin Panel Structure

The plugin renders as a floating panel with a tabbed interface:

```
┌─────────────────────────────────┐
│ 🔍 SEO Power Tool    [─] [×]   │
├─────────────────────────────────┤
│ [Audit] [Content] [Meta]       │
│ [Schema] [Links] [Dashboard]   │
├─────────────────────────────────┤
│                                  │
│  (Tab content renders here)     │
│                                  │
│                                  │
│                                  │
└─────────────────────────────────┘
```

**Plugin window size:** `framer.showUI({ width: 380, height: 600 })` — standard Framer plugin panel size. Resizable by user.

### Core API Usage Map

| Feature | Framer APIs Used | AI Integration |
|---------|-----------------|----------------|
| **SEO Audit** | `getNodesWithType("FrameNode")`, `getNodesWithAttribute("backgroundImage")`, `getNodesWithType("TextNode")`, `getPublishInfo()`, `getCollections()` | GEO scoring via AI |
| **AI Content Score** | `getCollections()`, `collection.getItems()`, text content extraction from CMS | OpenAI NLP analysis + SERP comparison |
| **Alt Text** | `getNodesWithAttributeSet("backgroundImage")`, `node.backgroundImage`, `node.name` (for context), set via node trait mutation | GPT-4o vision for context-aware alt text |
| **Heading Checker** | `getNodesWithType("TextNode")`, `node.font` (detect heading level from tag), `node.getChildren()`, `node.getParent()`, `framer.navigateTo()` | AI heading rewrite suggestions |
| **Meta Editor** | `getCollections()`, `collection.getItems()`, `collection.getFields()`, `item.setAttributes()`, `item.fieldData` | AI meta title/description generation |
| **Schema Generator** | `createCodeFile()`, `codeFile.setFileContent()`, `collection.getItems()`, `getPublishInfo()` | AI auto-detect type + auto-fill properties |
| **Internal Links** | `getNodesWithAttribute("link")`, `node.link`, page path enumeration via Nodes with `path` trait | AI contextual link suggestions + anchor text |
| **GEO Score** | All text content, heading structure, schema presence, page metadata | AI multi-dimension GEO analysis |
| **E-E-A-T Checker** | All page content, author info, about page, contact, citations | AI E-E-A-T signal evaluation |
| **Dashboard** | All of the above + `localStorage` for historical scores | Dual SEO + GEO score display |

---

## 3. Data Flow

### Audit Flow: Page Scan → Analysis → Results → Fixes

```
1. USER ACTION: Clicks "Run Audit" (page or site-wide)
                    │
                    ▼
2. COLLECT: Plugin queries Framer APIs in parallel
   ├─ getNodesWithType("FrameNode") → all frames
   ├─ getNodesWithType("TextNode") → all text nodes
   ├─ getNodesWithAttributeSet("backgroundImage") → all images
   ├─ getNodesWithAttribute("link") → all links
   ├─ getCollections() → CMS data
   └─ getPublishInfo() → site URL info
                    │
                    ▼
3. ANALYZE: Run checks against collected data
   ├─ HeadingChecker.analyze(textNodes)
   ├─ AltTextChecker.analyze(imageNodes)
   ├─ MetaChecker.analyze(cmsItems)
   ├─ SchemaChecker.analyze(pageNodes, cmsItems)
   ├─ LinkChecker.analyze(linkNodes, pageNodes)
   ├─ ContentChecker.analyze(textNodes)
   ├─ GEOChecker.analyze(allContent)        ← AI-powered
   └─ EEATChecker.analyze(allContent)       ← AI-powered
                    │
                    ▼
4. SCORE: Calculate dual scores
   ├─ ScoreEngine.calculateSEO(seoResults)  → 0-100
   └─ ScoreEngine.calculateGEO(geoResults)  → 0-100
                    │
                    ▼
5. DISPLAY: Render results in plugin panel
   ├─ Dual score badges (SEO + GEO)
   ├─ Issue list sorted by severity
   └─ "🤖 AI Fix" buttons on AI-fixable issues
                    │
                    ▼
6. FIX: User clicks fix → AI generates → plugin writes back
   ├─ AI alt text: generateObject() → node.setAttributes()
   ├─ AI meta: generateObject() → item.setAttributes()
   ├─ AI schema: generateObject() → createCodeFile()
   └─ AI links: generateObject() → insert links in CMS
                    │
                    ▼
7. RE-SCORE: Automatically re-run affected checks
   └─ Scores update in real-time → dopamine loop
```

### Data Model

```typescript
interface AuditResult {
  id: string
  timestamp: number
  pageId: string | null        // null = site-wide
  seoScore: number             // 0-100 (traditional SEO)
  geoScore: number             // 0-100 (AI search readiness)
  contentScore?: number        // 0-100 (NLP content quality)
  eeatScore?: number           // 0-100 (E-E-A-T signals)
  categories: CategoryScore[]
  issues: Issue[]
  aiCreditsUsed: number
}

interface CategoryScore {
  category: "content" | "technical" | "links" | "media" | "ai-readiness"
  score: number
  weight: number
  issueCount: number
}

interface Issue {
  id: string
  category: CategoryScore["category"]
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  nodeId?: string              // For canvas navigation
  cmsItemId?: string           // For CMS navigation
  fixType: "auto-ai" | "semi-auto" | "manual"  // auto-ai = AI one-click fix
  fixAction?: () => Promise<void>
  aiFixAvailable: boolean      // True if AI can auto-fix this issue
}

// AI Content Score types
interface ContentScoreResult {
  score: number                // 0-100
  grade: string                // "A+" through "F"
  topicCoverage: number        // 0-100 percentage
  missingTopics: string[]
  missingEntities: string[]
  keywordDensity: number
  idealKeywordDensity: number
  wordCount: number
  idealWordCount: number
  recommendations: ContentRecommendation[]
}

interface ContentRecommendation {
  priority: "high" | "medium" | "low"
  action: string
}

// GEO Score types
interface GEOScoreResult {
  geoScore: number
  dimensions: {
    definitions: DimensionScore
    qaStructure: DimensionScore
    citations: DimensionScore
    structuredData: DimensionScore
    authority: DimensionScore
    organization: DimensionScore
  }
  recommendations: string[]
}

interface DimensionScore {
  score: number
  issues: string[]
}

// Internal Link Suggestion types
interface LinkSuggestion {
  sourcePageId: string
  sourcePagePath: string
  anchorText: string
  targetPageId: string
  targetPagePath: string
  relevanceScore: number       // 0-100
  rationale: string
}
```


---

## 4. External Dependencies

### Required External Services

| Service | Purpose | Cost | Alternative |
|---------|---------|------|-------------|
| **OpenAI API** | AI alt text, meta generation, content scoring, schema detection, GEO analysis, E-E-A-T checks, content briefs, internal link suggestions | ~$0.001-0.01/action (GPT-4o-mini text), ~$0.01-0.03/action (GPT-4o vision) | User brings their own key (free tier) or our pooled key (Pro/Agency) |
| **Stripe** | Subscription billing | 2.9% + $0.30/transaction | LemonSqueezy, Paddle |
| **Vercel / Cloudflare Workers** | License validation API + AI proxy (rate limiting, credit tracking) | Free tier sufficient | Any serverless platform |
| **SERP API** (V1.1+) | Fetch top-ranking pages for content scoring comparison | ~$0.005/query (SerpAPI, ValueSerp) | Scrape with proxy, or cache results aggressively |

### No External SEO Libraries

We intentionally avoid external SEO analysis libraries (like `meta-inspector`, `seo-analyzer`, etc.) because:

1. **Plugin runs in browser sandbox** — no Node.js APIs available
2. **We have direct Framer API access** — we don't need to scrape HTML, we read the source of truth
3. **Custom analysis = competitive moat** — our checks are Framer-specific, not generic HTML checks
4. **Bundle size matters** — every dependency adds to load time inside Framer

All SEO analysis logic is custom-built TypeScript. The AI features use OpenAI as a service, not local ML.

### AI Architecture: Centralized AI Service

All AI features route through a single service layer that handles API keys, rate limiting, credit tracking, and prompt management.

```typescript
// ai/AIService.ts — Centralized AI service using Vercel AI SDK
import { generateObject, generateText, streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

type AIFeature = 
  | "alt-text"              // Image alt text generation
  | "meta-generate"         // Meta title/description writing
  | "schema-detect"         // Auto-detect schema type + fill properties
  | "content-score"         // NLP content analysis vs SERP
  | "content-gap"           // Missing topics/entities analysis
  | "content-brief"         // Full content brief generation
  | "internal-links"        // Contextual link suggestions
  | "geo-score"             // AI search readiness analysis
  | "eeat-check"            // E-E-A-T signal evaluation
  | "heading-rewrite"       // AI heading optimization

// Credit costs per feature
const CREDIT_COSTS: Record<AIFeature, number> = {
  "alt-text": 1,
  "meta-generate": 1,
  "schema-detect": 1,
  "content-score": 3,        // More expensive (analyzes multiple pages)
  "content-gap": 3,
  "content-brief": 5,        // Most expensive (generates full brief)
  "internal-links": 2,
  "geo-score": 2,
  "eeat-check": 2,
  "heading-rewrite": 1,
}

class AIService {
  private openai: ReturnType<typeof createOpenAI>
  private creditsRemaining: number
  
  constructor(config: { apiKey: string; useProxy: boolean; proxyUrl?: string }) {
    this.openai = createOpenAI({
      apiKey: config.apiKey,
      // If using pooled key, route through our Vercel proxy
      ...(config.useProxy && { baseURL: `${config.proxyUrl}/v1` }),
      compatibility: 'strict',
    })
    this.creditsRemaining = 0
  }

  // Structured output — returns typed object matching Zod schema
  // This is the primary method. No JSON.parse() needed.
  async generateStructured<T>(
    feature: AIFeature,
    schema: z.ZodType<T>,
    prompt: string,
    systemPrompt: string,
    model: string = 'gpt-4o-mini'
  ): Promise<T> {
    this.checkAndDeductCredits(feature)
    
    const { object } = await generateObject({
      model: this.openai(model),
      schema,
      system: systemPrompt,
      prompt,
      temperature: 0.3,
    })
    
    return object
  }

  // Plain text output — for alt text, heading rewrites
  async generateText(
    feature: AIFeature,
    prompt: string,
    systemPrompt: string,
    model: string = 'gpt-4o-mini'
  ): Promise<string> {
    this.checkAndDeductCredits(feature)
    
    const { text } = await generateText({
      model: this.openai(model),
      system: systemPrompt,
      prompt,
      temperature: 0.3,
      maxTokens: 200,
    })
    
    return text
  }

  // Streaming output — for content briefs (long generation)
  async generateStream(
    feature: AIFeature,
    prompt: string,
    systemPrompt: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    this.checkAndDeductCredits(feature)
    
    const result = streamText({
      model: this.openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt,
      temperature: 0.3,
    })
    
    let full = ''
    for await (const chunk of result.textStream) {
      full += chunk
      onChunk(chunk)
    }
    return full
  }
  
  private checkAndDeductCredits(feature: AIFeature): void {
    const cost = CREDIT_COSTS[feature]
    if (this.creditsRemaining < cost) {
      throw new AICreditsExhaustedError(feature, cost, this.creditsRemaining)
    }
    this.creditsRemaining -= cost
    // Persist to plugin data
    framer.setPluginData("creditsUsed", String(
      parseInt(framer.getPluginData("creditsUsed") || "0") + cost
    ))
  }
}

// Example: AI Meta Generation with structured output
async function generateMeta(ai: AIService, pageContent: string, keyword: string) {
  const result = await ai.generateStructured(
    'meta-generate',
    z.object({
      title: z.string().max(60),
      description: z.string().max(160),
    }),
    `Page content: ${pageContent}\nTarget keyword: ${keyword}`,
    AI_PROMPTS.META_GENERATE.system,
  )
  // result is { title: string, description: string } — fully typed!
  return result
}

// Example: AI Content Score with structured output
async function scoreContent(ai: AIService, content: string, keyword: string, competitorSummaries: string) {
  const result = await ai.generateStructured(
    'content-score',
    z.object({
      score: z.number().min(0).max(100),
      grade: z.string(),
      topicCoverage: z.number(),
      missingTopics: z.array(z.string()),
      missingEntities: z.array(z.string()),
      keywordDensity: z.number(),
      idealKeywordDensity: z.number(),
      wordCount: z.number(),
      idealWordCount: z.number(),
      recommendations: z.array(z.object({
        priority: z.enum(['high', 'medium', 'low']),
        action: z.string(),
      })),
    }),
    `Target keyword: ${keyword}\nContent: ${content}\nCompetitor data: ${competitorSummaries}`,
    AI_PROMPTS.CONTENT_SCORE.system,
  )
  return result  // Fully typed ContentScoreResult!
}
```

### AI Prompt Library

Each AI feature has a carefully crafted system prompt:

```typescript
// services/ai-prompts.ts
export const AI_PROMPTS = {
  ALT_TEXT: {
    system: `Generate concise, descriptive alt text for web images. 
    Focus on what the image shows and its relevance to the page context. 
    Keep it under 125 characters. Do not start with "Image of" or "Picture of".
    Include relevant keywords naturally when appropriate.`,
    model: "gpt-4o" as const,  // Vision model
  },
  
  META_GENERATE: {
    system: `You are an SEO expert writing meta tags for web pages.
    For meta titles: Write compelling, keyword-rich titles. 50-60 characters.
    For meta descriptions: Write click-worthy descriptions that summarize the page 
    and include a call-to-action. 150-160 characters.
    Output JSON: { "title": "...", "description": "..." }`,
    model: "gpt-4o-mini" as const,
  },
  
  SCHEMA_DETECT: {
    system: `You are a structured data expert. Analyze the page content and determine:
    1. The most appropriate Schema.org type (Article, Product, FAQ, HowTo, Organization, etc.)
    2. All applicable properties with values extracted from the content.
    3. If the content contains Q&A patterns, also generate FAQPage schema.
    Output valid JSON-LD. Be thorough — fill every property you can from the content.`,
    model: "gpt-4o-mini" as const,
  },
  
  CONTENT_SCORE: {
    system: `You are an NLP content analysis engine. Given:
    - Target keyword
    - The user's page content
    - Top-ranking competitor page contents (summaries)
    
    Analyze and output JSON:
    {
      "score": 0-100,
      "grade": "A+" to "F",
      "topicCoverage": 0-100,
      "missingTopics": ["topic1", "topic2"],
      "missingEntities": ["entity1", "entity2"],
      "keywordDensity": 0.0,
      "idealKeywordDensity": 0.0,
      "wordCount": 0,
      "idealWordCount": 0,
      "recommendations": [
        { "priority": "high"|"medium"|"low", "action": "..." }
      ]
    }`,
    model: "gpt-4o-mini" as const,
  },
  
  INTERNAL_LINKS: {
    system: `You are an internal linking strategist. Given a list of pages with their 
    content summaries, suggest contextual internal links.
    For each suggestion, provide:
    - Source page (where to add the link)
    - Anchor text (the clickable text)
    - Target page (what to link to)
    - Relevance score (0-100)
    - Rationale (why this link makes sense)
    Focus on semantic relevance, not just keyword matching.
    Output JSON array of suggestions sorted by relevance.`,
    model: "gpt-4o-mini" as const,
  },
  
  GEO_SCORE: {
    system: `You are a Generative Engine Optimization (GEO) expert. 
    Analyze page content for AI search readiness. AI search engines (ChatGPT, Perplexity, 
    Google AI Overviews) prefer content that:
    1. Has clear, concise definitions ("X is...")
    2. Uses Q&A format with explicit questions as headings
    3. Cites sources and provides references
    4. Has structured data (schema markup)
    5. Includes authoritative statements with evidence
    6. Is well-organized with clear hierarchy
    7. Has summary/TL;DR sections
    8. Contains unique data, statistics, or insights
    
    Output JSON:
    {
      "geoScore": 0-100,
      "dimensions": {
        "definitions": { "score": 0-100, "issues": [] },
        "qaStructure": { "score": 0-100, "issues": [] },
        "citations": { "score": 0-100, "issues": [] },
        "structuredData": { "score": 0-100, "issues": [] },
        "authority": { "score": 0-100, "issues": [] },
        "organization": { "score": 0-100, "issues": [] }
      },
      "recommendations": [...]
    }`,
    model: "gpt-4o-mini" as const,
  },
  
  EEAT_CHECK: {
    system: `You are a Google E-E-A-T (Experience, Expertise, Authoritativeness, 
    Trustworthiness) evaluator. Analyze the page content and structure for:
    
    Experience: Does the content demonstrate first-hand experience?
    Expertise: Is the author knowledgeable? Are credentials shown?
    Authoritativeness: Is the site/author recognized in their field?
    Trustworthiness: Is there contact info, about page, privacy policy, secure site?
    
    Output JSON:
    {
      "eeatScore": 0-100,
      "experience": { "score": 0-100, "signals": [], "missing": [] },
      "expertise": { "score": 0-100, "signals": [], "missing": [] },
      "authoritativeness": { "score": 0-100, "signals": [], "missing": [] },
      "trustworthiness": { "score": 0-100, "signals": [], "missing": [] },
      "recommendations": [...]
    }`,
    model: "gpt-4o-mini" as const,
  },
  
  CONTENT_BRIEF: {
    system: `You are a content strategist creating an SEO content brief.
    Given a target keyword and SERP analysis data, generate:
    {
      "keyword": "...",
      "contentType": "blog post" | "landing page" | "guide" | etc.,
      "targetWordCount": { "min": 0, "ideal": 0, "max": 0 },
      "suggestedTitle": "...",
      "suggestedHeadings": [{ "level": "h2"|"h3", "text": "..." }],
      "requiredTopics": ["topic1", "topic2"],
      "requiredEntities": ["entity1", "entity2"],
      "questionsToAnswer": ["q1", "q2"],
      "competitorInsights": [{ "url": "...", "strength": "...", "weakness": "..." }],
      "toneGuidance": "...",
      "internalLinkOpportunities": ["page1", "page2"]
    }`,
    model: "gpt-4o-mini" as const,
  },
  
  HEADING_REWRITE: {
    system: `You are an SEO copywriter. Rewrite the given heading to be:
    1. More descriptive and keyword-rich
    2. Properly nested in the heading hierarchy
    3. Engaging for readers
    4. Optimized for search engines
    Keep the same meaning and approximate length.
    Output JSON: { "original": "...", "rewritten": "...", "reasoning": "..." }`,
    model: "gpt-4o-mini" as const,
  },
}
```

**API Key Management:** Free tier users provide their own OpenAI API key, stored in plugin data. Pro/Agency tiers use our pooled key routed through a Vercel backend that handles rate limiting and credit tracking.

### Local NLP with wink-nlp (Browser-Safe Preprocessing)

wink-nlp runs entirely in-browser, reducing OpenAI API calls and tokens:

```typescript
// ai/nlp.ts — Local NLP preprocessing
import winkNLP from 'wink-nlp'
import model from 'wink-eng-lite-web-model'

const nlp = winkNLP(model)
const its = nlp.its
const as = nlp.as

// Extract keywords from page content (no API call needed)
function extractKeywords(text: string): string[] {
  const doc = nlp.readDoc(text)
  return doc.tokens()
    .filter(t => t.out(its.type) === 'word' && t.out(its.stopWordFlag) === false)
    .out(its.normal, as.freqTable)
    .slice(0, 20)
    .map(([word]) => word)
}

// Calculate keyword density locally
function keywordDensity(text: string, keyword: string): number {
  const doc = nlp.readDoc(text.toLowerCase())
  const tokens = doc.tokens().out()
  const keywordTokens = keyword.toLowerCase().split(/\s+/)
  const matches = tokens.filter(t => keywordTokens.includes(t)).length
  return matches / tokens.length
}

// Extract entities for Content Score
function extractEntities(text: string): string[] {
  const doc = nlp.readDoc(text)
  return doc.entities().out(its.detail)
    .map(e => e.value)
}

// Sentence count for readability
function sentenceCount(text: string): number {
  return nlp.readDoc(text).sentences().length()
}

// Preprocess content before sending to OpenAI
// Reduces token usage by 50-70%
function prepareForAI(fullText: string): {
  keywords: string[]
  entities: string[]
  sentenceCount: number
  wordCount: number
  summary: string  // First 500 words — enough for AI analysis
} {
  const keywords = extractKeywords(fullText)
  const entities = extractEntities(fullText)
  const words = fullText.split(/\s+/)
  
  return {
    keywords,
    entities,
    sentenceCount: sentenceCount(fullText),
    wordCount: words.length,
    summary: words.slice(0, 500).join(' ')
  }
}
```

**Why this matters for cost:**
- Instead of sending 2,000-word page content to OpenAI (~2,500 tokens, ~$0.004)
- We send: 20 keywords + 10 entities + 500-word summary (~800 tokens, ~$0.001)
- **60% token reduction** on every Content Score, GEO Score, and E-E-A-T check

### SERP API Integration (Content Score Comparison)

For Content Score, we compare user content against top-ranking pages. This requires SERP data:

```typescript
// services/serp.ts — SERP API via our Vercel backend proxy
interface SERPResult {
  position: number
  title: string
  url: string
  description: string
  // Content extracted by our backend (cheerio + readability)
  contentSummary?: string
  wordCount?: number
  headings?: string[]
}

async function fetchSERP(keyword: string): Promise<SERPResult[]> {
  // Check cache first (plugin data, 72h TTL)
  const cacheKey = `serp:${keyword}`
  const cached = framer.getPluginData(cacheKey)
  if (cached) {
    const { results, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < 72 * 60 * 60 * 1000) return results
  }
  
  // Fetch via our proxy (handles Serper.dev API + content extraction)
  const response = await fetch(`${PROXY_URL}/serp`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${licenseKey}` },
    body: JSON.stringify({ keyword, limit: 10 })
  })
  const results = await response.json()
  
  // Cache results
  framer.setPluginData(cacheKey, JSON.stringify({
    results, timestamp: Date.now()
  }))
  
  return results
}
```

**Backend proxy (Vercel Edge Function):**
1. Receives keyword from plugin
2. Calls Serper.dev API ($50/mo for 50,000 queries)
3. Fetches top 5 result URLs with cheerio + @mozilla/readability
4. Extracts: word count, headings, content summary
5. Returns to plugin

**Cost:** ~$0.001 per keyword query (Serper.dev). Cached 72h. Shared across all users querying the same keyword.

### Cost Estimates Per Feature

| Feature | Model | Avg Tokens | Cost/Action | Notes |
|---------|-------|-----------|-------------|-------|
| Alt Text | GPT-4o (vision) | ~200 | ~$0.01 | Image + context |
| Meta Generate | GPT-4o-mini | ~300 | ~$0.0003 | Very cheap |
| Schema Detect | GPT-4o-mini | ~800 | ~$0.001 | Longer output |
| Content Score | GPT-4o-mini | ~2000 | ~$0.003 | Needs competitor data input |
| Content Gap | GPT-4o-mini | ~1500 | ~$0.002 | Comparative analysis |
| Content Brief | GPT-4o-mini | ~3000 | ~$0.005 | Most output |
| Internal Links | GPT-4o-mini | ~1500 | ~$0.002 | Analyzes multiple pages |
| GEO Score | GPT-4o-mini | ~1500 | ~$0.002 | Multi-dimension scoring |
| E-E-A-T Check | GPT-4o-mini | ~1500 | ~$0.002 | Multi-dimension scoring |
| Heading Rewrite | GPT-4o-mini | ~200 | ~$0.0003 | Quick rewrite |

**Monthly cost for Pro user (500 credits):** ~$1-3 in API costs. Well within margin at $19/mo.
**Monthly cost for Agency user (2000 credits):** ~$5-12 in API costs. Well within margin at $49/mo.

---

## 5. Storage Strategy

### Plugin Data (Framer-managed)

Framer provides `framer.setPluginData()` / `framer.getPluginData()` for persistent key-value storage scoped to the project + plugin combination. This survives editor sessions.

```typescript
// What we store in Plugin Data
interface PluginStorage {
  // User preferences
  openaiApiKey: string         // Encrypted
  licenseKey: string           // Stripe subscription
  defaultSchemaType: string    // Last-used schema type
  
  // Audit history (last 30 audits)
  auditHistory: AuditResult[]
  
  // Per-page scores for trend tracking
  pageScores: Record<string, { score: number; timestamp: number }[]>
}
```

### localStorage (Browser-managed)

For transient UI state that doesn't need to persist across projects:

```typescript
// What we store in localStorage
interface LocalState {
  activeTab: string            // Last active tab
  panelSize: { w: number; h: number }
  dismissedTips: string[]      // Onboarding tips dismissed
  lastAuditPageId: string      // Resume where user left off
}
```

### Storage Limits & Strategy

- **Plugin Data:** No documented size limit, but keep it small (<500KB). Store only computed scores, not raw node data.
- **Audit History:** Keep last 30 audits. Oldest auto-evicted on new audit.
- **No cloud sync for MVP:** All data lives in Framer project. V2 could add optional cloud sync for cross-device access.


---

## 6. Project Structure

```
framer-seo-plugin/
├── framer.json                    # Plugin manifest (name, modes, icon)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html                     # Entry point for plugin UI
│
├── src/
│   ├── main.tsx                   # Plugin entry — showUI, mode routing
│   ├── App.tsx                    # Root component with tab router
│   │
│   ├── components/                # Shared UI components
│   │   ├── TabBar.tsx
│   │   ├── ScoreBadge.tsx         # Color-coded 0-100 score circle
│   │   ├── IssueCard.tsx          # Single issue with fix button
│   │   ├── IssueList.tsx          # Sortable/filterable issue list
│   │   ├── SerpPreview.tsx        # Google SERP snippet preview
│   │   ├── ProgressBar.tsx        # Scan progress indicator
│   │   ├── EmptyState.tsx         # "Run your first audit" CTA
│   │   ├── LicenseGate.tsx        # Paywall for Pro/Agency features
│   │   └── Tooltip.tsx
│   │
│   ├── tabs/                      # Main tab views
│   │   ├── AuditTab.tsx           # One-click audit + SEO/GEO scores
│   │   ├── ContentScoreTab.tsx    # 🤖 AI content scoring (NLP)
│   │   ├── MetaEditorTab.tsx      # Bulk meta editor + AI generate
│   │   ├── SchemaTab.tsx          # AI smart schema generator
│   │   ├── LinksTab.tsx           # AI internal link suggestions
│   │   └── DashboardTab.tsx       # Dual score overview + trends
│   │
│   ├── engine/                    # Core SEO analysis logic
│   │   ├── AuditEngine.ts         # Orchestrates all checkers
│   │   ├── ScoreEngine.ts         # Weighted SEO + GEO scoring
│   │   ├── checkers/
│   │   │   ├── HeadingChecker.ts  # H1-H6 hierarchy validation
│   │   │   ├── AltTextChecker.ts  # Missing alt text detection
│   │   │   ├── MetaChecker.ts     # Title/desc length & dups
│   │   │   ├── SchemaChecker.ts   # JSON-LD presence/validity
│   │   │   ├── LinkChecker.ts     # Internal link graph analysis
│   │   │   ├── ContentChecker.ts  # Word count, readability
│   │   │   ├── GEOChecker.ts      # 🤖 AI search readiness checks
│   │   │   └── EEATChecker.ts     # 🤖 E-E-A-T signal checks
│   │   └── types.ts               # Shared types for engine
│   │
│   ├── ai/                        # 🤖 AI service layer
│   │   ├── AIService.ts           # Centralized AI request handler
│   │   ├── prompts.ts             # AI prompt library (all features)
│   │   ├── credits.ts             # Credit tracking & enforcement
│   │   ├── ContentScorer.ts       # NLP content analysis vs SERP
│   │   ├── MetaGenerator.ts       # AI meta title/desc generation
│   │   ├── SchemaDetector.ts      # AI schema type detection + fill
│   │   ├── LinkSuggester.ts       # AI internal link suggestions
│   │   ├── GEOAnalyzer.ts         # AI search readiness scoring
│   │   ├── EEATAnalyzer.ts        # E-E-A-T evaluation
│   │   ├── ContentBriefGen.ts     # AI content brief generation
│   │   ├── HeadingRewriter.ts     # AI heading optimization
│   │   └── AltTextGenerator.ts    # Context-aware AI alt text
│   │
│   ├── services/                  # External integrations
│   │   ├── openai.ts              # OpenAI API client (direct + proxy)
│   │   ├── serp.ts                # SERP API for content comparison
│   │   ├── license.ts             # Stripe license + credit validation
│   │   └── framer-helpers.ts      # Wrappers around framer API
│   │
│   ├── hooks/                     # React hooks
│   │   ├── useAudit.ts            # Audit state & actions
│   │   ├── useContentScore.ts     # 🤖 AI content scoring state
│   │   ├── useAICredits.ts        # 🤖 Credit tracking & display
│   │   ├── useSelection.ts        # framer.subscribeToSelection
│   │   ├── usePublishInfo.ts      # framer.subscribeToPublishInfo
│   │   ├── useCollections.ts      # CMS collection data
│   │   ├── usePluginData.ts       # Persistent storage
│   │   └── useLicense.ts          # License tier + AI tier check
│   │
│   ├── schema/                    # JSON-LD templates
│   │   ├── article.ts
│   │   ├── product.ts
│   │   ├── faq.ts
│   │   ├── organization.ts
│   │   ├── localBusiness.ts
│   │   ├── breadcrumbList.ts
│   │   ├── howTo.ts               # NEW: HowTo schema
│   │   ├── event.ts               # NEW: Event schema
│   │   ├── recipe.ts              # NEW: Recipe schema
│   │   └── validator.ts           # Schema validation
│   │
│   ├── utils/                     # Pure utility functions
│   │   ├── seo-rules.ts           # Constants (title length, etc.)
│   │   ├── scoring.ts             # Score calculation helpers
│   │   ├── text-analysis.ts       # Word count, readability
│   │   └── export.ts              # Copy/export audit results
│   │
│   └── styles/                    # CSS modules
│       ├── global.css
│       ├── tabs.module.css
│       ├── components.module.css
│       └── variables.css          # Design tokens
│
├── test/                          # Tests
│   ├── engine/
│   │   ├── HeadingChecker.test.ts
│   │   ├── AltTextChecker.test.ts
│   │   ├── MetaChecker.test.ts
│   │   ├── ScoreEngine.test.ts
│   │   └── LinkChecker.test.ts
│   └── utils/
│       └── text-analysis.test.ts
│
└── assets/                        # Plugin icon, screenshots
    ├── icon.svg                   # Marketplace icon (64x64)
    └── screenshots/               # Marketplace listing images
```


---

## 7. Build & Deploy

### Development Setup

```bash
# Create plugin from template
npm create framer-plugin@latest framer-seo-plugin
cd framer-seo-plugin

# Install dependencies
npm install

# Start development server
npm run dev
# → Plugin available at localhost:5173
# → Open Framer > Plugins > Open Development Plugin
```

### framer.json (Plugin Manifest)

```json
{
  "id": "framer-seo-power-tool",
  "name": "SEO Power Tool",
  "modes": ["default"],
  "icon": "./assets/icon.svg",
  "description": "Comprehensive SEO auditing, optimization, and monitoring for Framer sites",
  "categories": ["SEO"],
  "author": "Your Company",
  "website": "https://framerseo.com"
}
```

### Build for Production

```bash
# Build optimized bundle
npm run build
# → Outputs to dist/ folder
```

### Framer Marketplace Submission

1. **Build** the plugin: `npm run build`
2. **Test** thoroughly in Framer editor (multiple projects, CMS and non-CMS sites)
3. **Prepare assets:**
   - Plugin icon (64×64 SVG)
   - 3-5 screenshots (1280×800 recommended)
   - Short description (150 chars)
   - Long description (features, use cases)
4. **Submit** via Framer Creator Dashboard
5. **Review timeline:**
   - Initial review: ~7 days
   - Design review: ~14 days
   - Total: ~3 weeks from submission to publish
6. **Contact:** creators@framer.com for questions

### Post-Publish Updates

- Push updates via the same Creator Dashboard
- Updates auto-deploy to all users
- Use semantic versioning (1.0.0 → 1.1.0 for features, 1.0.1 for fixes)

---

## 8. Detailed Feature Implementation

### 8.1 SEO Audit Scoring Algorithm

#### Category Weights

```typescript
// SEO Score weights (traditional Google optimization)
const SEO_CATEGORY_WEIGHTS = {
  content: 0.30,        // 30% — Meta titles, descriptions, word count
  technical: 0.25,      // 25% — Headings, schema markup, canonical
  media: 0.20,          // 20% — Alt text, image optimization
  links: 0.25           // 25% — Internal links, orphan pages
}

// GEO Score weights (AI search readiness) — separate score
const GEO_CATEGORY_WEIGHTS = {
  definitions: 0.20,    // 20% — Clear "X is..." definitions
  qaStructure: 0.20,    // 20% — Q&A format, question headings
  citations: 0.15,      // 15% — Source citations, references
  structuredData: 0.15, // 15% — Schema markup presence/quality
  authority: 0.15,      // 15% — Author info, credentials, EEAT
  organization: 0.15    // 15% — Clear hierarchy, summaries
}
```

#### Scoring Rules

Each check produces a pass/fail/warning result. Category scores are calculated as percentage of passed checks within that category.

```typescript
interface CheckResult {
  checkId: string
  status: "pass" | "fail" | "warning"
  weight: number           // Relative importance within category (1-5)
  message: string
  affectedNodes: string[]  // Node IDs for navigation
}

// Scoring algorithm
function calculateScore(results: CheckResult[]): number {
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const result of results) {
    const value = result.status === "pass" ? 1 
                : result.status === "warning" ? 0.5 
                : 0
    totalWeightedScore += value * result.weight
    totalWeight += result.weight
  }

  return Math.round((totalWeightedScore / totalWeight) * 100)
}
```

#### Check Catalog (MVP)

**SEO Checks:**

| Check ID | Category | Weight | Rule | AI Fix? |
|----------|----------|--------|------|---------|
| `meta-title-exists` | content | 5 | Every page has a meta title | ✅ AI Generate |
| `meta-title-length` | content | 3 | Title is 30-60 characters | ✅ AI Rewrite |
| `meta-desc-exists` | content | 5 | Every page has a meta description | ✅ AI Generate |
| `meta-desc-length` | content | 3 | Description is 120-160 characters | ✅ AI Rewrite |
| `meta-desc-unique` | content | 4 | No duplicate descriptions across pages | ✅ AI Generate unique |
| `h1-exists` | technical | 5 | Every page has exactly one H1 | ✅ AI Suggest |
| `h1-unique` | technical | 3 | H1 is unique across pages | ✅ AI Rewrite |
| `heading-hierarchy` | technical | 4 | No skipped heading levels | ✅ AI Suggest |
| `schema-exists` | technical | 3 | Page has JSON-LD structured data | ✅ AI Auto-generate |
| `alt-text-present` | media | 5 | All images have alt text | ✅ AI Generate (vision) |
| `alt-text-quality` | media | 2 | Alt text > 10 chars, not generic | ✅ AI Rewrite |
| `image-count` | media | 1 | Page has at least one image | ❌ Manual |
| `internal-links-min` | links | 4 | Every page has ≥2 internal links | ✅ AI Suggest links |
| `no-orphan-pages` | links | 5 | No pages with zero inbound links | ✅ AI Suggest links |
| `outbound-links` | links | 2 | Pages have relevant outbound links | ❌ Manual |

**GEO Checks (AI Search Readiness):**

| Check ID | Dimension | Weight | Rule |
|----------|-----------|--------|------|
| `geo-definitions` | definitions | 4 | Page has clear "X is..." definition paragraphs |
| `geo-qa-format` | qaStructure | 4 | Headings use question format where appropriate |
| `geo-citations` | citations | 3 | Content cites sources, includes references |
| `geo-structured-data` | structuredData | 4 | Schema markup present and comprehensive |
| `geo-author-info` | authority | 3 | Author name, bio, credentials visible |
| `geo-summary` | organization | 3 | Has TL;DR or summary section |
| `geo-unique-data` | authority | 2 | Contains original stats, data, or insights |
| `geo-hierarchy` | organization | 3 | Clear heading hierarchy with descriptive headings |


### 8.2 Alt Text Detector + AI Generation Flow

#### Detection Logic

```typescript
async function detectMissingAltText(): Promise<AltTextIssue[]> {
  const issues: AltTextIssue[] = []
  
  // 1. Scan canvas images (FrameNodes with backgroundImage)
  const imageNodes = await framer.getNodesWithAttributeSet("backgroundImage")
  
  for (const node of imageNodes) {
    const image = node.backgroundImage
    if (!image) continue
    
    // Check if alt text exists and is meaningful
    const altText = image.altText || ""
    
    if (!altText.trim()) {
      issues.push({
        type: "missing",
        nodeId: node.id,
        nodeName: node.name || "Unnamed image",
        imageUrl: image.url,
        currentAltText: "",
        severity: "critical"
      })
    } else if (altText.length < 10 || isGenericAltText(altText)) {
      issues.push({
        type: "low-quality",
        nodeId: node.id,
        nodeName: node.name || "Unnamed image",
        imageUrl: image.url,
        currentAltText: altText,
        severity: "warning"
      })
    }
  }
  
  // 2. Scan CMS image fields
  const collections = await framer.getCollections()
  for (const collection of collections) {
    const fields = await collection.getFields()
    const imageFields = fields.filter(f => f.type === "image")
    
    if (imageFields.length === 0) continue
    
    const items = await collection.getItems()
    for (const item of items) {
      for (const field of imageFields) {
        const imageData = item.fieldData[field.id]
        if (imageData && !imageData.altText) {
          issues.push({
            type: "cms-missing",
            cmsItemId: item.id,
            cmsItemSlug: item.slug,
            fieldId: field.id,
            fieldName: field.name,
            imageUrl: imageData.url,
            currentAltText: "",
            severity: "critical"
          })
        }
      }
    }
  }
  
  return issues
}

function isGenericAltText(text: string): boolean {
  const generic = [
    /^image$/i, /^photo$/i, /^picture$/i, /^img$/i,
    /^screenshot$/i, /^untitled$/i, /^img_\d+/i,
    /^dsc_\d+/i, /^screen\s*shot/i, /^image\s*\d+/i
  ]
  return generic.some(pattern => pattern.test(text.trim()))
}
```

#### AI Generation Flow (using Vercel AI SDK)

```
User clicks "🤖 Fix All" or "🤖 Generate Alt Text"
        │
        ▼
Batch images (max 5 at a time to avoid rate limits)
        │
        ▼
For each image:
  1. Get image URL from Framer asset
  2. Get page context via wink-nlp (nearby text → keywords/entities)
  3. Call ai.generateText('alt-text', ...) with GPT-4o vision
  4. Return suggested alt text
        │
        ▼
Display suggestions in review modal:
  ┌─────────────────────────────────────┐
  │ 📸 AI Alt Text Generator            │
  │                                     │
  │ [image preview] "A team of developers│
  │                  collaborating at a  │
  │                  whiteboard"         │
  │        [Edit] [✓ Accept] [✗ Skip]   │
  │                                     │
  │ [image preview] "Dashboard showing  │
  │                  real-time analytics │
  │                  with bar charts"    │
  │        [Edit] [✓ Accept] [✗ Skip]   │
  │                                     │
  │ [✓ Accept All (8)]   [Cancel]       │
  │                                     │
  │ 🤖 AI Credits: 8 of 500 used       │
  └─────────────────────────────────────┘
        │
        ▼
On "Accept" → Write alt text back via Framer API
  - Canvas images: node attribute update
  - CMS images: item.setAttributes()
```

**wink-nlp preprocessing:** Before sending to OpenAI, we extract keywords and entities from the surrounding text using wink-nlp. This gives the AI better context ("This image is on a page about project management tools, near content about Gantt charts") — resulting in more relevant, keyword-rich alt text while reducing token usage.

### 8.3 Heading Hierarchy Checker

#### Detection Logic

```typescript
interface HeadingNode {
  nodeId: string
  text: string
  level: number        // 1-6
  parentPageId: string
  depth: number        // Position in document order
}

async function analyzeHeadingHierarchy(pageNodeId?: string): Promise<HeadingIssue[]> {
  const issues: HeadingIssue[] = []
  
  // Get all text nodes
  const textNodes = pageNodeId 
    ? await (await framer.getNode(pageNodeId))?.getNodesWithType("TextNode")
    : await framer.getNodesWithType("TextNode")
  
  if (!textNodes) return issues
  
  // Extract heading nodes and their levels
  const headings: HeadingNode[] = []
  
  for (const node of textNodes) {
    // Framer text nodes have a "tag" or font trait
    // that indicates h1-h6 vs paragraph
    const tag = node.tag  // "h1", "h2", ..., "h6", "p", "span"
    
    if (tag && tag.match(/^h[1-6]$/)) {
      const level = parseInt(tag[1])
      const text = await node.getText?.() || node.name || ""
      headings.push({
        nodeId: node.id,
        text,
        level,
        parentPageId: pageNodeId || "site",
        depth: headings.length
      })
    }
  }
  
  // CHECK 1: Missing H1
  const h1s = headings.filter(h => h.level === 1)
  if (h1s.length === 0) {
    issues.push({
      type: "missing-h1",
      severity: "critical",
      title: "Missing H1 tag",
      description: "Every page should have exactly one H1 tag. This page has none.",
      fix: "Add an H1 heading to the page"
    })
  }
  
  // CHECK 2: Multiple H1s
  if (h1s.length > 1) {
    issues.push({
      type: "multiple-h1",
      severity: "critical",
      title: `Multiple H1 tags (${h1s.length} found)`,
      description: "Only one H1 tag should exist per page.",
      affectedNodes: h1s.map(h => h.nodeId),
      fix: "Change extra H1s to H2 or lower"
    })
  }
  
  // CHECK 3: Skipped levels (e.g., H1 → H3, skipping H2)
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1]
    const curr = headings[i]
    
    if (curr.level > prev.level + 1) {
      issues.push({
        type: "skipped-level",
        severity: "warning",
        title: `Heading level skipped: H${prev.level} → H${curr.level}`,
        description: `"${curr.text.slice(0, 40)}..." jumps from H${prev.level} to H${curr.level}. H${prev.level + 1} expected.`,
        affectedNodes: [curr.nodeId],
        fix: `Change to H${prev.level + 1}`
      })
    }
  }
  
  return issues
}
```

#### Heading Tree Visualization

The plugin renders headings as an indented tree:

```
Heading Structure:
├─ H1: "Welcome to Our SaaS Platform"    ✅
│  ├─ H2: "Features"                     ✅
│  │  ├─ H3: "Analytics Dashboard"        ✅
│  │  └─ H3: "Team Collaboration"         ✅
│  ├─ H2: "Pricing"                       ✅
│  │  └─ H4: "Enterprise Plan"            ⚠️ Skipped H3
│  └─ H2: "Contact Us"                    ✅
└─ H1: "Footer Heading"                   🔴 Multiple H1

Score: 75/100 — 2 issues found
```

Clicking any heading navigates to it on canvas: `framer.navigateTo(nodeId)`


### 8.4 Meta Editor with CMS API Bulk Operations

#### Architecture

The Meta Editor reads all CMS collections and displays items in a table format. It uses `collection.getItems()` for reading and `item.setAttributes()` for writing.

```typescript
interface MetaItem {
  id: string
  slug: string
  collectionId: string
  collectionName: string
  title: string
  metaTitle: string
  metaDescription: string
  ogImage: string | null
  issues: MetaIssue[]
}

type MetaIssue = 
  | { type: "title-missing" }
  | { type: "title-too-short"; length: number }
  | { type: "title-too-long"; length: number }
  | { type: "desc-missing" }
  | { type: "desc-too-short"; length: number }
  | { type: "desc-too-long"; length: number }
  | { type: "desc-duplicate"; duplicateOf: string }

// Constants
const META_RULES = {
  title: { min: 30, ideal: 55, max: 60 },
  description: { min: 120, ideal: 155, max: 160 }
}
```

#### Bulk Edit Flow

```typescript
async function bulkUpdateMeta(
  items: MetaItem[],
  template: { titleTemplate?: string; descTemplate?: string }
): Promise<void> {
  // Get all collections referenced
  const collectionMap = new Map<string, Collection>()
  const collections = await framer.getCollections()
  for (const c of collections) {
    collectionMap.set(c.id, c)
  }
  
  // Process items in batches of 20
  const batches = chunk(items, 20)
  
  for (const batch of batches) {
    const updates = batch.map(async (metaItem) => {
      const collection = collectionMap.get(metaItem.collectionId)
      if (!collection) return
      
      const allItems = await collection.getItems()
      const cmsItem = allItems.find(i => i.id === metaItem.id)
      if (!cmsItem) return
      
      const fields = await collection.getFields()
      const metaTitleField = fields.find(f => 
        f.name.toLowerCase().includes("meta title") || 
        f.name.toLowerCase() === "seo title"
      )
      const metaDescField = fields.find(f => 
        f.name.toLowerCase().includes("meta description") || 
        f.name.toLowerCase() === "seo description"
      )
      
      const fieldData: Record<string, any> = {}
      
      if (template.titleTemplate && metaTitleField) {
        fieldData[metaTitleField.id] = interpolateTemplate(
          template.titleTemplate, 
          cmsItem.fieldData
        )
      }
      
      if (template.descTemplate && metaDescField) {
        fieldData[metaDescField.id] = interpolateTemplate(
          template.descTemplate, 
          cmsItem.fieldData
        )
      }
      
      if (Object.keys(fieldData).length > 0) {
        await cmsItem.setAttributes({ fieldData })
      }
    })
    
    await Promise.all(updates)
    // Small delay between batches to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

// Template interpolation: "{title} | {site_name}" → "My Post | MySaaS"
function interpolateTemplate(
  template: string, 
  fieldData: Record<string, any>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = fieldData[key]
    return typeof value === "string" ? value : key
  })
}
```

#### SERP Preview Component

```typescript
function SerpPreview({ title, description, url }: SerpPreviewProps) {
  const truncatedTitle = title.length > 60 ? title.slice(0, 57) + "..." : title
  const truncatedDesc = description.length > 160 
    ? description.slice(0, 157) + "..." 
    : description
  
  return (
    <div className={styles.serpPreview}>
      <div className={styles.serpTitle}>{truncatedTitle || "Missing title"}</div>
      <div className={styles.serpUrl}>{url}</div>
      <div className={styles.serpDesc}>{truncatedDesc || "Missing description"}</div>
      <div className={styles.charCounts}>
        <span className={getColorClass(title.length, 30, 60)}>
          Title: {title.length}/60
        </span>
        <span className={getColorClass(description.length, 120, 160)}>
          Desc: {description.length}/160
        </span>
      </div>
    </div>
  )
}
```

### 8.5 Schema Markup Generator (JSON-LD)

#### Template System

Each schema type has a TypeScript template that maps CMS fields to JSON-LD properties:

```typescript
// schema/article.ts
export function generateArticleSchema(data: ArticleSchemaInput): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": data.headline,
    "description": data.description,
    "image": data.image,
    "datePublished": data.datePublished,
    "dateModified": data.dateModified || data.datePublished,
    "author": {
      "@type": data.authorType || "Person",
      "name": data.authorName,
      ...(data.authorUrl && { "url": data.authorUrl })
    },
    "publisher": {
      "@type": "Organization",
      "name": data.publisherName,
      ...(data.publisherLogo && {
        "logo": {
          "@type": "ImageObject",
          "url": data.publisherLogo
        }
      })
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": data.pageUrl
    }
  }
  
  return JSON.stringify(schema, null, 2)
}

// Available schema types
const SCHEMA_TYPES = {
  Article: { template: generateArticleSchema, requiredFields: ["headline", "datePublished", "authorName"] },
  Product: { template: generateProductSchema, requiredFields: ["name", "price", "currency"] },
  FAQ: { template: generateFAQSchema, requiredFields: ["questions"] },
  Organization: { template: generateOrgSchema, requiredFields: ["name", "url"] },
  LocalBusiness: { template: generateLocalBusinessSchema, requiredFields: ["name", "address"] },
  BreadcrumbList: { template: generateBreadcrumbSchema, requiredFields: ["items"] }
}
```

#### Code File Injection

Schema markup is injected into the Framer project via the Code Files API as a code override:

```typescript
async function injectSchemaMarkup(
  pageId: string, 
  schemaJson: string
): Promise<void> {
  const fileName = `seo-schema-${pageId}.tsx`
  
  // Generate code override file content
  const codeContent = `
import type { ComponentType } from "react"

// Auto-generated by SEO Power Tool
// Schema markup for page: ${pageId}
// Last updated: ${new Date().toISOString()}

const schemaData = ${schemaJson}

export function withSEOSchema(Component: ComponentType): ComponentType {
  return (props) => {
    return (
      <>
        <Component {...props} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </>
    )
  }
}
`

  // Check if file already exists
  const existingFiles = await framer.getCodeFiles()
  const existing = existingFiles.find(f => f.name === fileName)
  
  if (existing) {
    await existing.setFileContent(codeContent)
    framer.notify(`Schema updated for page`, { variant: "success" })
  } else {
    await framer.createCodeFile({
      name: fileName,
      content: codeContent
    })
    framer.notify(`Schema created — apply the override to your page`, { variant: "success" })
  }
  
  // Navigate to the code file so user can apply the override
  const files = await framer.getCodeFiles()
  const newFile = files.find(f => f.name === fileName)
  if (newFile) {
    await newFile.navigateTo()
  }
}
```

#### Schema Validation

```typescript
function validateSchema(schema: object): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check required @context
  if (!schema["@context"] || schema["@context"] !== "https://schema.org") {
    errors.push("Missing or invalid @context — must be 'https://schema.org'")
  }
  
  // Check @type exists
  if (!schema["@type"]) {
    errors.push("Missing @type property")
  }
  
  // Type-specific validation
  const type = schema["@type"]
  switch (type) {
    case "Article":
      if (!schema["headline"]) errors.push("Article: 'headline' is required")
      if (!schema["datePublished"]) errors.push("Article: 'datePublished' is required")
      if (schema["headline"]?.length > 110) warnings.push("Headline exceeds 110 chars")
      break
    case "Product":
      if (!schema["name"]) errors.push("Product: 'name' is required")
      if (!schema["offers"]) warnings.push("Product: 'offers' recommended for rich results")
      break
    case "FAQPage":
      if (!schema["mainEntity"]?.length) errors.push("FAQ: needs at least one question")
      break
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
```


### 8.6 Internal Link Analysis

#### Link Graph Builder

```typescript
interface PageNode {
  id: string
  path: string        // URL path from node trait
  name: string
  inboundLinks: string[]   // Page IDs linking TO this page
  outboundLinks: string[]  // Page IDs this page links TO
}

interface LinkGraph {
  pages: Map<string, PageNode>
  orphanPages: PageNode[]
  underlinkedPages: PageNode[]  // Pages with < 2 inbound links
}

async function buildLinkGraph(): Promise<LinkGraph> {
  const pages = new Map<string, PageNode>()
  
  // 1. Get all pages (top-level FrameNodes with a "path" trait)
  const allFrameNodes = await framer.getNodesWithType("FrameNode")
  
  for (const node of allFrameNodes) {
    const path = node.path
    if (!path) continue  // Not a page node
    
    pages.set(node.id, {
      id: node.id,
      path,
      name: node.name || path,
      inboundLinks: [],
      outboundLinks: []
    })
  }
  
  // 2. Find all nodes with links and map them
  const linkedNodes = await framer.getNodesWithAttributeSet("link")
  
  for (const node of linkedNodes) {
    const linkValue = node.link
    if (!linkValue) continue
    
    // Find which page this node belongs to
    const sourcePageId = await findParentPage(node, pages)
    if (!sourcePageId) continue
    
    // Check if link is internal
    const targetPageId = resolveInternalLink(linkValue, pages)
    if (!targetPageId) continue  // External link
    
    // Record the link
    const sourcePage = pages.get(sourcePageId)
    const targetPage = pages.get(targetPageId)
    
    if (sourcePage && targetPage) {
      sourcePage.outboundLinks.push(targetPageId)
      targetPage.inboundLinks.push(sourcePageId)
    }
  }
  
  // 3. Identify orphans and underlinked pages
  const orphanPages: PageNode[] = []
  const underlinkedPages: PageNode[] = []
  
  for (const [, page] of pages) {
    if (page.path === "/" || page.path === "/index") continue // Skip homepage
    
    if (page.inboundLinks.length === 0) {
      orphanPages.push(page)
    } else if (page.inboundLinks.length < 2) {
      underlinkedPages.push(page)
    }
  }
  
  return { pages, orphanPages, underlinkedPages }
}

async function findParentPage(
  node: CanvasNode, 
  pages: Map<string, PageNode>
): Promise<string | null> {
  let current = node
  while (current) {
    if (pages.has(current.id)) return current.id
    const parent = await current.getParent()
    if (!parent) break
    current = parent
  }
  return null
}

function resolveInternalLink(
  link: string, 
  pages: Map<string, PageNode>
): string | null {
  // Internal links in Framer can be:
  // - Relative paths: "/about", "/blog/post-1"
  // - Node references: internal node IDs
  
  for (const [id, page] of pages) {
    if (page.path === link || `/${page.path}` === link) {
      return id
    }
  }
  return null
}
```

#### Link Analysis UI

```
Internal Link Analysis
━━━━━━━━━━━━━━━━━━━━━

🔴 Orphan Pages (3) — No inbound links
  /blog/old-post-2023    0 in / 2 out  [Go to page]
  /privacy-policy         0 in / 0 out  [Go to page]
  /case-study-acme        0 in / 1 out  [Go to page]

⚠️ Underlinked Pages (5) — Less than 2 inbound links
  /pricing               1 in / 3 out  [Go to page]
  /blog/seo-guide        1 in / 4 out  [Go to page]
  ...

✅ Well-Linked Pages (12)
  /                     — / 8 out (homepage)
  /about                4 in / 3 out
  /features             6 in / 5 out
  ...

Link Score: 65/100
Tip: Add internal links from high-traffic pages to orphan pages
```

---

## 9. Codex Build Instructions

The following is a complete, step-by-step prompt for Codex (or Claude Code, or any AI coding agent) to build this plugin from scratch.

### Phase 1: Project Scaffolding (Steps 1-3)

```
STEP 1: Create the Framer plugin project

Run: npm create framer-plugin@latest framer-seo-plugin
When prompted:
- Name: framer-seo-plugin
- Template: React + TypeScript

Then:
cd framer-seo-plugin
npm install
npm install ai @ai-sdk/openai zod wink-nlp wink-eng-lite-web-model schema-dts @tremor/react recharts tailwindcss @tailwindcss/vite lucide-react

STEP 2: Set up the project structure

Create the following directories:
src/components/
src/tabs/
src/engine/
src/engine/checkers/
src/services/
src/hooks/
src/schema/
src/utils/
src/styles/
test/engine/
test/utils/
assets/

STEP 3: Configure framer.json

Update framer.json with:
{
  "id": "framer-seo-power-tool",
  "name": "SEO Power Tool",
  "modes": ["default"],
  "description": "Comprehensive SEO auditing and optimization for Framer"
}
```

### Phase 2: Core Engine (Steps 4-9)

```
STEP 4: Create type definitions (src/engine/types.ts)

Define these TypeScript interfaces:
- AuditResult: { id, timestamp, pageId, seoScore, geoScore, contentScore?, eeatScore?, categories, issues, aiCreditsUsed }
- CategoryScore: { category: "content"|"technical"|"links"|"media"|"ai-readiness", score, weight, issueCount }
- Issue: { id, category, severity, title, description, nodeId?, fixType: "auto-ai"|"semi-auto"|"manual", fixAction?, aiFixAvailable }
- CheckResult: { checkId, status, weight, message, affectedNodes }
- HeadingNode: { nodeId, text, level, parentPageId }
- MetaItem: { id, slug, title, metaTitle, metaDescription, issues }
- LinkGraph: { pages, orphanPages, underlinkedPages }
- PageNode: { id, path, name, inboundLinks, outboundLinks }
- ContentScoreResult: { score, grade, topicCoverage, missingTopics, missingEntities, keywordDensity, recommendations }
- GEOScoreResult: { geoScore, dimensions: { definitions, qaStructure, citations, structuredData, authority, organization }, recommendations }
- LinkSuggestion: { sourcePageId, anchorText, targetPageId, relevanceScore, rationale }

STEP 5: Build HeadingChecker (src/engine/checkers/HeadingChecker.ts)

Export an async function analyzeHeadings() that:
1. Gets all TextNodes via framer.getNodesWithType("TextNode")
2. Filters for heading tags (h1-h6)
3. Checks: missing H1, multiple H1s, skipped levels
4. Each issue includes aiFixAvailable: true (AI can suggest rewrites)
5. Returns CheckResult[] array
See Section 8.3 for complete implementation.

STEP 6: Build AltTextChecker (src/engine/checkers/AltTextChecker.ts)

Export an async function analyzeAltText() that:
1. Gets all nodes with backgroundImage via framer.getNodesWithAttributeSet("backgroundImage")
2. Checks each image for missing or generic alt text
3. Also scans CMS collections for image fields without alt text
4. Each issue includes aiFixAvailable: true (AI can generate alt text)
5. Returns CheckResult[] with affected node IDs
See Section 8.2 for complete implementation.

STEP 7: Build MetaChecker (src/engine/checkers/MetaChecker.ts)

Export an async function analyzeMeta() that:
1. Gets all CMS collections via framer.getCollections()
2. Reads items and finds meta title/description fields
3. Checks: missing, too short (<30 title, <120 desc), too long (>60 title, >160 desc), duplicates
4. Each issue includes aiFixAvailable: true (AI can generate meta tags)
5. Returns CheckResult[]

STEP 8: Build ScoreEngine (src/engine/ScoreEngine.ts)

Export TWO scoring functions:
- calculateSEOScore(results: CheckResult[]): number
  1. Groups results by category
  2. Applies SEO weights: content=0.30, technical=0.25, media=0.20, links=0.25
  3. Within each category: sum(value × weight) / sum(weight) where pass=1, warning=0.5, fail=0
  4. Final score = weighted average, rounded to 0-100

- calculateGEOScore(geoResults: GEOScoreResult): number
  1. Applies GEO weights: definitions=0.20, qaStructure=0.20, citations=0.15, structuredData=0.15, authority=0.15, organization=0.15
  2. Returns weighted average of dimension scores

STEP 9: Build AI Service Layer (src/ai/)

Create the centralized AI service using Vercel AI SDK:
- AIService.ts: Uses `generateObject()`, `generateText()`, `streamText()` from 'ai' package.
  - `generateStructured<T>(feature, zodSchema, prompt, system)` → returns typed T
  - `generateText(feature, prompt, system)` → returns string
  - `generateStream(feature, prompt, system, onChunk)` → streams for content briefs
  - Handles credit checking/deduction before each call
  - Supports both user API key (direct) and pooled key (via proxy)
- prompts.ts: Prompt library for each feature (see AI Prompt Library section)
- credits.ts: Track credit usage per billing cycle, enforce limits by tier (10/500/2000)
- nlp.ts: wink-nlp initialization + preprocessing functions (extractKeywords, extractEntities, keywordDensity, prepareForAI)
- Each feature module (ContentScorer.ts, MetaGenerator.ts, etc.) calls AIService methods
See Section 4 for complete AI Architecture with code examples.
```

### Phase 3: UI Components (Steps 10-15)

```
STEP 10: Build shared UI components (src/components/)

Create these React components:
- DualScoreBadge: TWO circular badges side-by-side — SEO Score (blue) + GEO Score (purple)
- ScoreBadge: Single circular badge showing 0-100 score with color (green 80+, yellow 50-79, red <50)
- IssueCard: Card showing issue title, severity icon, description, "🤖 AI Fix" or "Fix" button
- IssueList: Sortable list of IssueCards, filterable by category/severity, with "AI Fix All" bulk button
- SerpPreview: Google-style SERP snippet showing title (blue), URL (green), description (gray)
- AIPreview: Shows AI-generated content with "Accept / Edit / Reject" buttons
- ProgressBar: Animated progress bar for scan progress
- CreditsBadge: Shows remaining AI credits for current billing period
- EmptyState: "Run your first audit" call-to-action with illustration
- TabBar: Horizontal tab navigation with icons (6 tabs)

STEP 11: Build AuditTab (src/tabs/AuditTab.tsx)

Main audit view:
1. "Audit This Page" and "Audit Entire Site" buttons
2. On click: run AuditEngine (SEO checks) + GEO checks in parallel, show ProgressBar
3. Display DualScoreBadge: SEO Score + GEO Score
4. Display IssueList sorted by severity
5. Each issue has "🤖 AI Fix" button (for AI-fixable) or "Go To" button (navigate to node)
6. "AI Fix All" button — batches all auto-fixable issues through AI service
7. After any fix, re-run affected checks and update scores in real-time
8. CreditsBadge shows remaining AI credits

STEP 12: Build ContentScoreTab (src/tabs/ContentScoreTab.tsx) — NEW

🤖 AI-powered content scoring (the SurferSEO killer):
1. Dropdown to select CMS collection + specific item (or current page)
2. Input field for target keyword
3. "Analyze" button → calls ContentScorer.ts
4. Shows Content Score (0-100) with letter grade (A+ to F)
5. Breakdown panel:
   - Topic Coverage: progress bar (e.g., 65% — missing 7 of 20 topics)
   - Missing Topics: tag list of topics to add
   - Missing Entities: tag list of entities competitors mention
   - Keyword Density: current vs ideal
   - Word Count: current vs ideal (based on top-ranking pages)
6. Recommendations list with priority badges (high/medium/low)
7. Score updates as user edits content in CMS (poll or subscription)

STEP 13: Build MetaEditorTab (src/tabs/MetaEditorTab.tsx)

CMS meta editor with AI generation:
1. Dropdown to select CMS collection
2. Table: Item Name | Meta Title | Meta Description | Score
3. Inline editing for title and description
4. Character count with color coding
5. SerpPreview for selected item
6. "🤖 AI Generate" button per item → calls MetaGenerator.ts → shows AIPreview
7. "🤖 Bulk AI Generate" → select multiple items → AI generates unique meta for each
8. "Bulk Edit" button → template modal with {field} interpolation
9. Writes via item.setAttributes({ fieldData })

STEP 14: Build SchemaTab (src/tabs/SchemaTab.tsx)

AI smart schema generator:
1. Page selector (current page or pick from list)
2. "🤖 AI Detect" button → AI reads page content, suggests best schema type + auto-fills all properties
3. Manual override: schema type dropdown (Article, Product, FAQ, Organization, LocalBusiness, BreadcrumbList, HowTo, Event, Recipe)
4. Form fields pre-populated by AI (editable)
5. JSON-LD preview panel
6. Validation status (✅ Valid / ⚠️ Warnings / 🔴 Errors)
7. "Generate & Inject" button → creates code file via Code Files API
8. FAQ auto-extraction: AI identifies Q&A patterns → generates FAQPage schema

STEP 15: Build LinksTab and DashboardTab

LinksTab (src/tabs/LinksTab.tsx):
1. Build link graph on load
2. Show orphan pages list (red)
3. Show underlinked pages (yellow)
4. Show well-linked pages (green)
5. "🤖 AI Suggest Links" button → AI analyzes all pages, returns LinkSuggestion[]
6. Each suggestion shows: source page, anchor text, target page, relevance score
7. "Add Link" button per suggestion → inserts link into CMS content
8. "Add All High-Confidence Links" → bulk add suggestions with 85%+ relevance
9. Click any page → navigateTo on canvas

DashboardTab (src/tabs/DashboardTab.tsx):
1. Dual score overview: SEO Score + GEO Score (side by side)
2. Category breakdown (5 gauges: content, technical, media, links, AI-readiness)
3. E-E-A-T score (if checked)
4. Content Score (if keyword set)
5. Page list sortable by any score
6. Score trend chart (last 30 audits from plugin data)
7. "Fix Highest Impact" button → navigates to worst issues with AI auto-fix
8. AI Credits usage bar for current period
```

### Phase 4: Services & Integration (Steps 16-18)

```
STEP 16: Build OpenAI service (src/services/openai.ts)

Central OpenAI API client supporting both direct and proxied calls:
- constructor(apiKey, useProxy, proxyUrl)
- chat(messages, model, options): Promise<string> — generic chat completion
- chatJSON(messages, model): Promise<object> — chat with JSON response format
- vision(imageUrl, prompt, context): Promise<string> — GPT-4o vision calls
- Rate limiting: max 5 concurrent, 500ms between batches
- Error handling: retry on 429, graceful degradation on 500

STEP 17: Build license service (src/services/license.ts)

Export functions:
- validateLicense(key: string): Promise<LicenseTier>
- isFeatureAvailable(feature: string, tier: LicenseTier): boolean
- getCreditsRemaining(): number — AI credits left in billing period
- deductCredits(feature: AIFeature): void — deduct + persist
Tiers: "free" (5 pages, 10 AI credits), "pro" (unlimited pages, 500 credits), "agency" (10 sites, 2000 credits)
Validation via API call to our Vercel backend

STEP 18: Build Framer helper wrappers (src/services/framer-helpers.ts)

Wrapper functions that handle errors gracefully:
- getAllPages(): Promise<PageInfo[]> — enumerate all pages in project
- getPageNodes(pageId): Promise<CanvasNode[]> — all nodes within a page
- getCMSMeta(collectionId): Promise<MetaItem[]> — extract meta data from CMS
- getPageContent(pageId): Promise<string> — extract all text content from a page (for AI analysis)
- getCMSItemContent(itemId): Promise<string> — extract all text from a CMS item
- writeMetaField(itemId, fieldId, value): Promise<void> — safe CMS write
- insertLinkInCMS(itemId, fieldId, anchorText, url): Promise<void> — insert internal link
```

### Phase 5: Assembly & Polish (Steps 19-21)

```
STEP 19: Wire up App.tsx with tab routing

Create src/App.tsx that:
1. Renders TabBar with 6 tabs: Audit, Content, Meta, Schema, Links, Dashboard
2. Routes to correct tab component
3. Wraps in Context providers (AuditContext, LicenseContext, AIContext)
4. AIContext provides: aiService instance, credits remaining, credit usage
5. Shows license gate for Pro features in free tier
6. Shows CreditsBadge in header bar

STEP 20: Add plugin data persistence

Create src/hooks/usePluginData.ts:
- On mount: load audit history, API keys, AI credits, preferences from framer.getPluginData()
- After each audit: save results (including GEO scores) to plugin data
- Keep last 30 audits, auto-evict oldest
- Track AI credit usage per billing period

Create src/hooks/useAICredits.ts:
- Returns: creditsRemaining, creditsUsed, creditLimit, tier
- deductCredits(feature) function
- resetCredits() called on billing cycle reset

STEP 21: Testing

Write Vitest tests for:
- ScoreEngine: verify SEO weighted calculation + GEO weighted calculation
- HeadingChecker: test missing H1, multiple H1, skipped levels
- MetaChecker: test length validation, duplicate detection
- AltTextChecker: test generic alt text detection
- Schema validator: test each schema type + AI auto-detection
- AIService: mock OpenAI responses, test credit deduction, rate limiting
- ContentScorer: test score calculation from AI response
- GEOChecker: test dimension scoring
- Credits: test enforcement at tier limits
```

### Phase 6: Build & Submit (Step 22)

```
STEP 22: Production build and submission prep

1. Run: npm run build
2. Test in Framer with real projects (CMS site, non-CMS site, large site)
3. Create plugin icon (64x64 SVG)
4. Take 5 screenshots for marketplace listing
5. Write marketplace description
6. Submit via Framer Creator Dashboard
7. Address any review feedback within 48 hours
```

---

*End of Technical Plan — Ready for Development*
