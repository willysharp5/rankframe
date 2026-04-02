import { framer } from "framer-plugin"

export type AIFeature =
  | "alt-text"
  | "meta-generate"
  | "schema-detect"
  | "content-score"
  | "content-gap"
  | "content-brief"
  | "internal-links"
  | "geo-score"
  | "eeat-check"
  | "heading-rewrite"

export type BillingTier = "free" | "pro" | "agency"

export interface CreditState {
  periodKey: string
  tier: BillingTier
  remaining: number
  used: number
}

export class AICreditsExhaustedError extends Error {
  constructor(feature: AIFeature, required: number, remaining: number) {
    super(`Insufficient credits for ${feature}. Required ${required}, remaining ${remaining}.`)
    this.name = "AICreditsExhaustedError"
  }
}

export const CREDIT_LIMITS: Record<BillingTier, number> = {
  free: 10,
  pro: 500,
  agency: 2000,
}

export const CREDIT_COSTS: Record<AIFeature, number> = {
  "alt-text": 1,
  "meta-generate": 1,
  "schema-detect": 1,
  "content-score": 3,
  "content-gap": 3,
  "content-brief": 5,
  "internal-links": 2,
  "geo-score": 2,
  "eeat-check": 2,
  "heading-rewrite": 1,
}

const STORAGE_KEY = "rankframe.ai.creditState"
const USED_KEY = "rankframe.ai.creditsUsed"

function currentPeriodKey(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
}

function createInitialState(tier: BillingTier): CreditState {
  return {
    periodKey: currentPeriodKey(),
    tier,
    remaining: CREDIT_LIMITS[tier],
    used: 0,
  }
}

export async function getCreditState(tier: BillingTier = "free"): Promise<CreditState> {
  const raw = await framer.getPluginData(STORAGE_KEY)
  if (!raw) return createInitialState(tier)

  try {
    const parsed = JSON.parse(raw) as CreditState
    if (parsed.periodKey !== currentPeriodKey()) return createInitialState(parsed.tier ?? tier)
    return parsed
  } catch {
    return createInitialState(tier)
  }
}

export async function saveCreditState(state: CreditState): Promise<void> {
  await Promise.all([
    framer.setPluginData(STORAGE_KEY, JSON.stringify(state)),
    framer.setPluginData(USED_KEY, String(state.used)),
  ])
}

export async function checkAndDeductCredits(feature: AIFeature, tier: BillingTier = "free"): Promise<CreditState> {
  const cost = CREDIT_COSTS[feature]
  const state = await getCreditState(tier)
  if (state.remaining < cost) {
    throw new AICreditsExhaustedError(feature, cost, state.remaining)
  }

  const nextState: CreditState = {
    ...state,
    remaining: state.remaining - cost,
    used: state.used + cost,
  }
  await saveCreditState(nextState)
  return nextState
}

