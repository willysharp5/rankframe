import { createContext, useContext } from "react"
import { useLicense } from "../hooks/useLicense"
import type { PluginApiKeys } from "../hooks/usePluginData"

interface LicenseContextValue extends ReturnType<typeof useLicense> {}

const LicenseContext = createContext<LicenseContextValue | null>(null)

export function LicenseProvider({
  apiKeys,
  children,
}: {
  apiKeys: PluginApiKeys
  children: React.ReactNode
}) {
  const value = useLicense(apiKeys.licenseKey)
  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>
}

export function useLicenseContext() {
  const context = useContext(LicenseContext)
  if (!context) {
    throw new Error("useLicenseContext must be used within LicenseProvider")
  }
  return context
}
