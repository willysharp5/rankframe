import { useCallback, useEffect, useState } from "react"
import {
  type AIFeature,
  type BillingTier,
  CREDIT_LIMITS,
  checkAndDeductCredits,
  getCreditState,
} from "../ai/credits"

export function useAICredits(tier: BillingTier = "pro") {
  const [state, setState] = useState({
    periodKey: "",
    tier,
    remaining: CREDIT_LIMITS[tier],
    used: 0,
  })

  const refresh = useCallback(async () => {
    const next = await getCreditState(tier)
    setState(next)
    return next
  }, [tier])

  const spend = useCallback(
    async (feature: AIFeature) => {
      const next = await checkAndDeductCredits(feature, tier)
      setState(next)
      return next
    },
    [tier]
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    credits: state,
    total: CREDIT_LIMITS[state.tier],
    refresh,
    spend,
  }
}
