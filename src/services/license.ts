import { getCreditState, CREDIT_LIMITS, type BillingTier } from "../ai/credits"

export type LicenseTier = BillingTier
export type LicenseFeature =
  | "audit"
  | "content"
  | "meta"
  | "schema"
  | "links"
  | "dashboard"
  | "unlimited-pages"
  | "multiple-sites"

const LICENSE_ENDPOINT =
  (import.meta.env.VITE_RANKFRAME_LICENSE_API as string | undefined) ?? "/api/license/validate"

const FEATURE_MATRIX: Record<LicenseTier, readonly LicenseFeature[]> = {
  free: ["audit", "dashboard"],
  pro: ["audit", "content", "meta", "schema", "links", "dashboard", "unlimited-pages"],
  agency: ["audit", "content", "meta", "schema", "links", "dashboard", "unlimited-pages", "multiple-sites"],
}

let currentTier: LicenseTier = "free"

export async function validateLicense(key: string): Promise<LicenseTier> {
  if (!key.trim()) {
    currentTier = "free"
    return currentTier
  }

  try {
    const response = await fetch(LICENSE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })

    if (!response.ok) {
      currentTier = "free"
      return currentTier
    }

    const data = (await response.json()) as { tier?: LicenseTier }
    currentTier = data.tier && data.tier in CREDIT_LIMITS ? data.tier : "free"
    return currentTier
  } catch {
    currentTier = "free"
    return currentTier
  }
}

export function isFeatureAvailable(feature: LicenseFeature, tier: LicenseTier): boolean {
  return FEATURE_MATRIX[tier].includes(feature)
}

export async function getCreditsRemaining(): Promise<number> {
  const state = await getCreditState(currentTier)
  return state.remaining
}

export function getCreditLimitForTier(tier: LicenseTier): number {
  return CREDIT_LIMITS[tier]
}
