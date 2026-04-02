import type { AIFeature, BillingTier } from "../ai/credits"
import { useAIContext } from "../contexts/AIContext"

export function useAICredits(_tier: BillingTier = "pro") {
  const { creditState, creditLimit, refreshCredits, deductCredits } = useAIContext()

  return {
    credits: creditState,
    total: creditLimit,
    refresh: refreshCredits,
    spend: (feature: AIFeature) => deductCredits(feature),
  }
}
