import { framer } from "framer-plugin"
import type { Issue } from "../engine/types"

type FramerLike = Record<string, (...args: unknown[]) => unknown>

function getFramerApi(): FramerLike {
  return framer as unknown as FramerLike
}

export async function safePluginDataGet(key: string): Promise<string | null> {
  try {
    const value = await framer.getPluginData(key)
    return value ?? null
  } catch {
    return null
  }
}

export async function safePluginDataSet(key: string, value: string): Promise<void> {
  try {
    await framer.setPluginData(key, value)
  } catch {
    // Ignore plugin data write failures in preview/dev mode.
  }
}

export async function getCollectionsSafe() {
  const api = getFramerApi()
  if (typeof api.getCollections !== "function") return []

  try {
    const result = await api.getCollections()
    return Array.isArray(result) ? result : []
  } catch {
    return []
  }
}

export async function navigateToIssue(issue: Issue): Promise<void> {
  const api = getFramerApi()

  try {
    if (issue.nodeId && typeof api.navigateToNode === "function") {
      await api.navigateToNode(issue.nodeId)
      return
    }
    if (issue.cmsItemId && typeof api.navigateToCMSItem === "function") {
      await api.navigateToCMSItem(issue.cmsItemId)
    }
  } catch {
    // Ignore if unavailable in local dev.
  }
}

export async function getPublishInfoSafe(): Promise<Record<string, unknown> | null> {
  const api = getFramerApi()
  if (typeof api.getPublishInfo !== "function") return null

  try {
    return (await api.getPublishInfo()) as Record<string, unknown>
  } catch {
    return null
  }
}
