import { useCallback, useEffect, useMemo, useState } from "react"
import type { AuditResult } from "../engine/types"
import { CREDIT_LIMITS, getCreditState, saveCreditState, type BillingTier, type CreditState } from "../ai/credits"
import { safePluginDataGet, safePluginDataSet } from "../services/framer-helpers"

const STORAGE_KEY = "rankframe.plugin.state"
const MAX_AUDITS = 30

export interface PluginApiKeys {
  openai: string
  proxyUrl: string
  useProxy: boolean
  licenseKey: string
}

export interface PluginPreferences {
  selectedTab: number
}

export interface PluginState {
  auditHistory: AuditResult[]
  apiKeys: PluginApiKeys
  preferences: PluginPreferences
}

const defaultState: PluginState = {
  auditHistory: [],
  apiKeys: {
    openai: "",
    proxyUrl: "",
    useProxy: false,
    licenseKey: "",
  },
  preferences: {
    selectedTab: 0,
  },
}

function sanitizeState(value: Partial<PluginState> | null | undefined): PluginState {
  return {
    auditHistory: Array.isArray(value?.auditHistory) ? value.auditHistory.slice(0, MAX_AUDITS) : [],
    apiKeys: {
      ...defaultState.apiKeys,
      ...(value?.apiKeys ?? {}),
    },
    preferences: {
      ...defaultState.preferences,
      ...(value?.preferences ?? {}),
    },
  }
}

function periodKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
}

export function usePluginData() {
  const [state, setState] = useState<PluginState>(defaultState)
  const [creditState, setCreditState] = useState<CreditState>({
    periodKey: periodKey(),
    tier: "free",
    remaining: CREDIT_LIMITS.free,
    used: 0,
  })
  const [isLoaded, setIsLoaded] = useState(false)

  const persist = useCallback(async (next: PluginState) => {
    setState(next)
    await safePluginDataSet(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const refreshCredits = useCallback(async (tier: BillingTier) => {
    const next = await getCreditState(tier)
    setCreditState(next)
    return next
  }, [])

  const syncCredits = useCallback(async (next: CreditState) => {
    setCreditState(next)
    await saveCreditState(next)
  }, [])

  const ensureBillingPeriod = useCallback(
    async (tier: BillingTier) => {
      const next = await refreshCredits(tier)
      if (next.periodKey === periodKey() && next.tier === tier) return next

      const reset = {
        periodKey: periodKey(),
        tier,
        remaining: CREDIT_LIMITS[tier],
        used: 0,
      }
      await syncCredits(reset)
      return reset
    },
    [refreshCredits, syncCredits]
  )

  const saveAudit = useCallback(
    async (audit: AuditResult) => {
      const next = {
        ...state,
        auditHistory: [audit, ...state.auditHistory].slice(0, MAX_AUDITS),
      }
      await persist(next)
    },
    [persist, state]
  )

  const setApiKeys = useCallback(
    async (apiKeys: Partial<PluginApiKeys>) => {
      const next = {
        ...state,
        apiKeys: {
          ...state.apiKeys,
          ...apiKeys,
        },
      }
      await persist(next)
    },
    [persist, state]
  )

  const setPreferences = useCallback(
    async (preferences: Partial<PluginPreferences>) => {
      const next = {
        ...state,
        preferences: {
          ...state.preferences,
          ...preferences,
        },
      }
      await persist(next)
    },
    [persist, state]
  )

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [rawState, rawCredits] = await Promise.all([safePluginDataGet(STORAGE_KEY), getCreditState("free")])

      if (cancelled) return

      if (rawState) {
        try {
          setState(sanitizeState(JSON.parse(rawState) as PluginState))
        } catch {
          setState(defaultState)
        }
      }

      setCreditState(rawCredits)
      setIsLoaded(true)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(
    () => ({
      ...state,
      creditState,
      isLoaded,
      saveAudit,
      setApiKeys,
      setPreferences,
      refreshCredits,
      ensureBillingPeriod,
      syncCredits,
    }),
    [creditState, ensureBillingPeriod, isLoaded, refreshCredits, saveAudit, setApiKeys, setPreferences, state, syncCredits]
  )
}
