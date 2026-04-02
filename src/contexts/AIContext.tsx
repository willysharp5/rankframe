import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { checkAndDeductCredits, CREDIT_LIMITS, type AIFeature, type CreditState } from "../ai/credits"
import { createOpenAIService } from "../services/openai"
import { useLicenseContext } from "./LicenseContext"
import type { PluginApiKeys } from "../hooks/usePluginData"

interface AIContextValue {
  aiService: ReturnType<typeof createOpenAIService>
  creditState: CreditState
  creditsRemaining: number
  creditsUsed: number
  creditLimit: number
  refreshCredits: () => Promise<CreditState>
  deductCredits: (feature: AIFeature) => Promise<CreditState>
}

const AIContext = createContext<AIContextValue | null>(null)

export function AIProvider({
  apiKeys,
  initialCreditState,
  ensureBillingPeriod,
  refreshStoredCredits,
  children,
}: {
  apiKeys: PluginApiKeys
  initialCreditState: CreditState
  ensureBillingPeriod: (tier: CreditState["tier"]) => Promise<CreditState>
  refreshStoredCredits: (tier: CreditState["tier"]) => Promise<CreditState>
  children: React.ReactNode
}) {
  const { tier } = useLicenseContext()
  const [creditState, setCreditState] = useState<CreditState>(initialCreditState)

  useEffect(() => {
    void ensureBillingPeriod(tier).then(setCreditState)
  }, [ensureBillingPeriod, tier])

  const aiService = useMemo(
    () =>
      createOpenAIService({
        apiKey: apiKeys.openai || undefined,
        proxyUrl: apiKeys.proxyUrl || undefined,
        useProxy: apiKeys.useProxy,
      }),
    [apiKeys.openai, apiKeys.proxyUrl, apiKeys.useProxy]
  )

  const value = useMemo<AIContextValue>(
    () => ({
      aiService,
      creditState,
      creditsRemaining: creditState.remaining,
      creditsUsed: creditState.used,
      creditLimit: CREDIT_LIMITS[tier],
      refreshCredits: async () => {
        const next = await refreshStoredCredits(tier)
        setCreditState(next)
        return next
      },
      deductCredits: async (feature: AIFeature) => {
        const next = await checkAndDeductCredits(feature, tier)
        setCreditState(next)
        return next
      },
    }),
    [aiService, creditState, refreshStoredCredits, tier]
  )

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}

export function useAIContext() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error("useAIContext must be used within AIProvider")
  }
  return context
}
