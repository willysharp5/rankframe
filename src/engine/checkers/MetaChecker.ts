import { framer, type CollectionItem, type Field } from "framer-plugin"
import type { CheckResult, MetaIssue, MetaItem } from "../types"

export const META_RULES = {
  title: { min: 30, ideal: 55, max: 60 },
  description: { min: 120, ideal: 155, max: 160 },
} as const

function getFieldIdByName(fields: Field[], matcher: (name: string) => boolean): string | null {
  const field = fields.find((entry) => matcher(entry.name.toLowerCase()))
  return field?.id ?? null
}

function getStringField(item: CollectionItem, fieldId: string | null): string {
  if (!fieldId) return ""
  const value = item.fieldData[fieldId] as unknown
  return typeof value === "string" ? value.trim() : ""
}

function collectMetaIssues(metaTitle: string, metaDescription: string): MetaIssue[] {
  const issues: MetaIssue[] = []

  if (!metaTitle) issues.push({ type: "title-missing" })
  else if (metaTitle.length < META_RULES.title.min) issues.push({ type: "title-too-short", length: metaTitle.length })
  else if (metaTitle.length > META_RULES.title.max) issues.push({ type: "title-too-long", length: metaTitle.length })

  if (!metaDescription) issues.push({ type: "desc-missing" })
  else if (metaDescription.length < META_RULES.description.min) issues.push({ type: "desc-too-short", length: metaDescription.length })
  else if (metaDescription.length > META_RULES.description.max) issues.push({ type: "desc-too-long", length: metaDescription.length })

  return issues
}

function toCheckResult(metaItem: MetaItem, issue: MetaIssue): CheckResult {
  const isCritical = issue.type === "title-missing" || issue.type === "desc-missing"
  const title = issue.type.replace(/-/g, " ")
  return {
    checkId: `meta-${issue.type}-${metaItem.id}`,
    category: "technical",
    status: isCritical ? "fail" : "warning",
    weight: isCritical ? 1 : 0.75,
    message: `${metaItem.slug}: ${title}.`,
    affectedNodes: [metaItem.id],
    issue: {
      id: `meta-${issue.type}-${metaItem.id}`,
      category: "technical",
      severity: isCritical ? "critical" : "warning",
      title: `Meta ${title}`,
      description: `The CMS item "${metaItem.slug}" has a meta issue: ${title}.`,
      cmsItemId: metaItem.id,
      fixType: "auto-ai",
      aiFixAvailable: true,
    },
    metadata: {
      slug: metaItem.slug,
      metaTitle: metaItem.metaTitle,
      metaDescription: metaItem.metaDescription,
      collectionId: metaItem.collectionId,
      duplicateOf: issue.duplicateOf,
    },
  }
}

export async function analyzeMeta(): Promise<CheckResult[]> {
  const collections = await framer.getCollections()
  const metaItems: MetaItem[] = []

  for (const collection of collections) {
    const fields = await collection.getFields()
    const titleFieldId =
      getFieldIdByName(fields, (name) => name.includes("meta title") || name === "seo title") ??
      getFieldIdByName(fields, (name) => name === "title" || name.includes("name"))
    const descriptionFieldId = getFieldIdByName(
      fields,
      (name) => name.includes("meta description") || name === "seo description" || name.includes("description")
    )
    const ogImageFieldId = getFieldIdByName(fields, (name) => name.includes("og image") || name.includes("social image"))

    const items = await collection.getItems()
    for (const item of items) {
      const title = getStringField(item, titleFieldId)
      const metaTitle = getStringField(item, titleFieldId)
      const metaDescription = getStringField(item, descriptionFieldId)
      const issues = collectMetaIssues(metaTitle, metaDescription)
      metaItems.push({
        id: item.id,
        slug: item.slug,
        collectionId: collection.id,
        collectionName: collection.name,
        title: title || item.slug,
        metaTitle,
        metaDescription,
        ogImage: typeof item.fieldData[ogImageFieldId ?? ""] === "string" ? String(item.fieldData[ogImageFieldId ?? ""]) : null,
        issues,
      })
    }
  }

  const seenDescriptions = new Map<string, string>()
  for (const metaItem of metaItems) {
    if (!metaItem.metaDescription) continue
    const key = metaItem.metaDescription.toLowerCase()
    const duplicateOf = seenDescriptions.get(key)
    if (duplicateOf) {
      metaItem.issues.push({ type: "desc-duplicate", duplicateOf })
    } else {
      seenDescriptions.set(key, metaItem.slug)
    }
  }

  const results = metaItems.flatMap((metaItem) => metaItem.issues.map((issue) => toCheckResult(metaItem, issue)))

  if (results.length === 0) {
    results.push({
      checkId: "meta-ok",
      category: "technical",
      status: "pass",
      weight: 1,
      message: "Meta titles and descriptions look valid across CMS items.",
      affectedNodes: [],
    })
  }

  return results
}
