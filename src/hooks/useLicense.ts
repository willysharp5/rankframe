import { useEffect, useMemo, useState } from "react"
import { isFeatureAvailable, validateLicense, type LicenseFeature, type LicenseTier } from "../services/license"

export interface UseLicenseResult {
  tier: LicenseTier
  status: "idle" | "validating" | "validated"
  isValidating: boolean
  features: Record<LicenseFeature, boolean>
}

const FEATURES: LicenseFeature[] = ["audit", "content", "meta", "schema", "links", "dashboard", "unlimited-pages", "multiple-sites"]

export function useLicense(key: string): UseLicenseResult {
  const [tier, setTier] = useState<LicenseTier>("free")
  const [status, setStatus] = useState<UseLicenseResult["status"]>("idle")

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setStatus("validating")
      const nextTier = await validateLicense(key)
      if (!cancelled) {
        setTier(nextTier)
        setStatus("validated")
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [key])

  const features = useMemo(
    () =>
      Object.fromEntries(FEATURES.map((feature) => [feature, isFeatureAvailable(feature, tier)])) as Record<
        LicenseFeature,
        boolean
      >,
    [tier]
  )

  return {
    tier,
    status,
    isValidating: status === "validating",
    features,
  }
}
