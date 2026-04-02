import { framer, isTextNode, isWebPageNode, type CanvasNode } from "framer-plugin"
import type { Issue, MetaIssue, MetaItem } from "../engine/types"

type FramerLike = Record<string, (...args: unknown[]) => unknown>
type FramerCollection = Awaited<ReturnType<typeof framer.getCollections>>[number]
type FramerCollectionItem = Awaited<ReturnType<FramerCollection["getItems"]>>[number]
type FramerField = Awaited<ReturnType<FramerCollection["getFields"]>>[number]

export interface PageInfo {
  id: string
  name: string
  path: string
  collectionId: string | null
}

function getFramerApi(): FramerLike {
  return framer as unknown as FramerLike
}

function entryValueToText(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : []
  if (typeof value === "number" || typeof value === "boolean") return [String(value)]
  if (Array.isArray(value)) return value.flatMap(entryValueToText)
  if (!value || typeof value !== "object") return []

  const record = value as Record<string, unknown>
  if ("url" in record && typeof record.url === "string") return []
  if ("value" in record) return entryValueToText(record.value)
  if ("text" in record) return entryValueToText(record.text)
  if ("title" in record) return entryValueToText(record.title)
  if ("description" in record) return entryValueToText(record.description)

  return Object.values(record).flatMap(entryValueToText)
}

function normalizeText(parts: string[]): string {
  return parts.join(" ").replace(/\s+/g, " ").trim()
}

function getMetaIssues(metaTitle: string, metaDescription: string): MetaIssue[] {
  const issues: MetaIssue[] = []

  if (!metaTitle) issues.push({ type: "title-missing" })
  else if (metaTitle.length < 30) issues.push({ type: "title-too-short", length: metaTitle.length })
  else if (metaTitle.length > 60) issues.push({ type: "title-too-long", length: metaTitle.length })

  if (!metaDescription) issues.push({ type: "desc-missing" })
  else if (metaDescription.length < 120) issues.push({ type: "desc-too-short", length: metaDescription.length })
  else if (metaDescription.length > 160) issues.push({ type: "desc-too-long", length: metaDescription.length })

  return issues
}

async function findCollectionItem(itemId: string): Promise<{ collection: FramerCollection; item: FramerCollectionItem } | null> {
  const collections = (await getCollectionsSafe()) as FramerCollection[]

  for (const collection of collections) {
    const items = await collection.getItems()
    const item = items.find((entry) => entry.id === itemId || entry.nodeId === itemId)
    if (item) return { collection, item }
  }

  return null
}

function getFieldType(fields: FramerField[], fieldId: string): "string" | "formattedText" | "link" {
  const field = fields.find((entry) => entry.id === fieldId)
  if (field?.type === "formattedText" || field?.type === "link") return field.type
  return "string"
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

export async function getAllPages(): Promise<PageInfo[]> {
  try {
    const root = await framer.getCanvasRoot()
    const pages = await root.getNodesWithType("WebPageNode")
    return pages
      .filter(isWebPageNode)
      .map((page) => ({
        id: page.id,
        name: page.name ?? page.path ?? "Untitled",
        path: page.path ?? "/",
        collectionId: page.collectionId,
      }))
  } catch {
    return []
  }
}

export async function getPageNodes(pageId: string): Promise<CanvasNode[]> {
  try {
    const page = await framer.getNode(pageId)
    if (!page) return []
    return await page.getChildren()
  } catch {
    return []
  }
}

export async function getCMSMeta(collectionId: string): Promise<MetaItem[]> {
  try {
    const collection = await framer.getCollection(collectionId)
    if (!collection) return []

    const [fields, items] = await Promise.all([collection.getFields(), collection.getItems()])
    const titleField =
      fields.find((field) => field.name.toLowerCase().includes("meta title")) ??
      fields.find((field) => field.name.toLowerCase() === "seo title")
    const descriptionField =
      fields.find((field) => field.name.toLowerCase().includes("meta description")) ??
      fields.find((field) => field.name.toLowerCase() === "seo description")

    return items.map((item) => {
      const metaTitle = normalizeText(entryValueToText(item.fieldData[titleField?.id ?? ""]))
      const metaDescription = normalizeText(entryValueToText(item.fieldData[descriptionField?.id ?? ""]))

      return {
        id: item.id,
        slug: item.slug,
        collectionId: collection.id,
        collectionName: collection.name,
        title: normalizeText(entryValueToText(item.fieldData.title ?? item.slug)),
        metaTitle,
        metaDescription,
        ogImage: null,
        issues: getMetaIssues(metaTitle, metaDescription),
      }
    })
  } catch {
    return []
  }
}

export async function getPageContent(pageId: string): Promise<string> {
  try {
    const page = await framer.getNode(pageId)
    if (!page) return ""

    const texts = await page.getNodesWithType("TextNode")
    const values = await Promise.all(
      texts.filter(isTextNode).map(async (node) => {
        try {
          return (await node.getText()) ?? ""
        } catch {
          return ""
        }
      })
    )

    return normalizeText(values)
  } catch {
    return ""
  }
}

export async function getCMSItemContent(itemId: string): Promise<string> {
  try {
    const match = await findCollectionItem(itemId)
    if (!match) return ""
    return normalizeText(Object.values(match.item.fieldData).flatMap(entryValueToText))
  } catch {
    return ""
  }
}

export async function writeMetaField(itemId: string, fieldId: string, value: string): Promise<void> {
  try {
    const match = await findCollectionItem(itemId)
    if (!match) return

    const fields = await match.collection.getFields()
    const fieldType = getFieldType(fields, fieldId)
    await match.item.setAttributes({
      fieldData: {
        [fieldId]:
          fieldType === "formattedText"
            ? { type: "formattedText", value, contentType: "html" }
            : fieldType === "link"
              ? { type: "link", value }
              : { type: "string", value },
      },
    })
  } catch {
    // Ignore writes when the Framer runtime is unavailable.
  }
}

export async function insertLinkInCMS(itemId: string, fieldId: string, anchorText: string, url: string): Promise<void> {
  try {
    const current = await getCMSItemContent(itemId)
    const appended = `${current}${current ? "\n\n" : ""}<a href="${url}">${anchorText}</a>`
    await writeMetaField(itemId, fieldId, appended)
  } catch {
    // Ignore writes when the Framer runtime is unavailable.
  }
}
