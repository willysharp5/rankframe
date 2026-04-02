export type AuditCategory =
  | "content"
  | "technical"
  | "links"
  | "media"
  | "ai-readiness"

export type IssueSeverity = "critical" | "warning" | "info"
export type FixType = "auto-ai" | "semi-auto" | "manual"
export type CheckStatus = "pass" | "warning" | "fail"

export interface CategoryScore {
  category: AuditCategory
  score: number
  weight: number
  issueCount: number
}

export interface Issue {
  id: string
  category: AuditCategory
  severity: IssueSeverity
  title: string
  description: string
  nodeId?: string
  cmsItemId?: string
  fixType: FixType
  fixAction?: () => Promise<void>
  aiFixAvailable: boolean
}

export interface CheckResult {
  checkId: string
  category: AuditCategory
  status: CheckStatus
  weight: number
  message: string
  affectedNodes: string[]
  issue?: Issue
  metadata?: Record<string, unknown>
}

export interface HeadingNode {
  nodeId: string
  text: string
  level: number
  parentPageId: string
  depth: number
}

export interface MetaIssue {
  type:
    | "title-missing"
    | "title-too-short"
    | "title-too-long"
    | "desc-missing"
    | "desc-too-short"
    | "desc-too-long"
    | "desc-duplicate"
  length?: number
  duplicateOf?: string
}

export interface MetaItem {
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

export interface PageNode {
  id: string
  path: string
  name: string
  inboundLinks: string[]
  outboundLinks: string[]
}

export interface LinkGraph {
  pages: Map<string, PageNode>
  orphanPages: PageNode[]
  underlinkedPages: PageNode[]
}

export interface ContentRecommendation {
  priority: "high" | "medium" | "low"
  action: string
}

export interface ContentScoreResult {
  score: number
  grade: string
  topicCoverage: number
  missingTopics: string[]
  missingEntities: string[]
  keywordDensity: number
  idealKeywordDensity: number
  wordCount: number
  idealWordCount: number
  recommendations: ContentRecommendation[]
}

export interface DimensionScore {
  score: number
  issues: string[]
}

export interface GEOScoreResult {
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

export interface EEATDimensionScore {
  score: number
  signals: string[]
  missing: string[]
}

export interface EEATScoreResult {
  eeatScore: number
  experience: EEATDimensionScore
  expertise: EEATDimensionScore
  authoritativeness: EEATDimensionScore
  trustworthiness: EEATDimensionScore
  recommendations: string[]
}

export interface LinkSuggestion {
  sourcePageId: string
  sourcePagePath: string
  anchorText: string
  targetPageId: string
  targetPagePath: string
  relevanceScore: number
  rationale: string
}

export interface ContentBriefHeading {
  level: "h2" | "h3"
  text: string
}

export interface CompetitorInsight {
  url: string
  strength: string
  weakness: string
}

export interface ContentBriefResult {
  keyword: string
  contentType: string
  targetWordCount: {
    min: number
    ideal: number
    max: number
  }
  suggestedTitle: string
  suggestedHeadings: ContentBriefHeading[]
  requiredTopics: string[]
  requiredEntities: string[]
  questionsToAnswer: string[]
  competitorInsights: CompetitorInsight[]
  toneGuidance: string
  internalLinkOpportunities: string[]
}

export interface HeadingRewriteResult {
  original: string
  rewritten: string
  reasoning: string
}

export interface AltTextSuggestion {
  altText: string
  rationale?: string
}

export interface AuditResult {
  id: string
  timestamp: number
  pageId: string | null
  seoScore: number
  geoScore: number
  contentScore?: number
  eeatScore?: number
  categories: CategoryScore[]
  issues: Issue[]
  aiCreditsUsed: number
}

