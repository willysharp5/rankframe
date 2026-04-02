import { framer, type Field, type ImageAsset } from "framer-plugin"
import type { CheckResult } from "../types"

function isGenericAltText(text: string): boolean {
  const genericPatterns = [
    /^image$/i,
    /^photo$/i,
    /^picture$/i,
    /^img$/i,
    /^screenshot$/i,
    /^untitled$/i,
    /^img_\d+/i,
    /^dsc_\d+/i,
    /^screen\s*shot/i,
    /^image\s*\d+/i,
  ]
  return genericPatterns.some((pattern) => pattern.test(text.trim()))
}

function getAssetAltText(asset: ImageAsset | null): string {
  return asset?.altText?.trim() ?? ""
}

function getImageFieldIds(fields: Field[]): string[] {
  return fields.filter((field) => field.type === "image").map((field) => field.id)
}

function getFieldImageAsset(value: unknown): ImageAsset | undefined {
  if (!value || typeof value !== "object") return undefined

  if ("url" in value) return value as ImageAsset
  if ("value" in value && value.value && typeof value.value === "object" && "url" in value.value) {
    return value.value as ImageAsset
  }

  return undefined
}

export async function analyzeAltText(): Promise<CheckResult[]> {
  const results: CheckResult[] = []
  const imageNodes = await framer.getNodesWithAttributeSet("backgroundImage")

  for (const node of imageNodes) {
    const image = node.backgroundImage
    if (!image) continue

    const altText = getAssetAltText(image)
    if (!altText) {
      results.push({
        checkId: `alt-missing-${node.id}`,
        category: "media",
        status: "fail",
        weight: 1,
        message: `Missing alt text on image node ${node.name ?? node.id}.`,
        affectedNodes: [node.id],
        issue: {
          id: `alt-missing-${node.id}`,
          category: "media",
          severity: "critical",
          title: "Missing alt text",
          description: "This image is missing alt text.",
          nodeId: node.id,
          fixType: "auto-ai",
          aiFixAvailable: true,
        },
        metadata: { imageUrl: image.url },
      })
      continue
    }

    if (altText.length < 10 || isGenericAltText(altText)) {
      results.push({
        checkId: `alt-generic-${node.id}`,
        category: "media",
        status: "warning",
        weight: 0.75,
        message: `Low-quality alt text on image node ${node.name ?? node.id}.`,
        affectedNodes: [node.id],
        issue: {
          id: `alt-generic-${node.id}`,
          category: "media",
          severity: "warning",
          title: "Generic alt text",
          description: "This image alt text is too short or generic.",
          nodeId: node.id,
          fixType: "auto-ai",
          aiFixAvailable: true,
        },
        metadata: { imageUrl: image.url, altText },
      })
    }
  }

  const collections = await framer.getCollections()
  for (const collection of collections) {
    const imageFieldIds = getImageFieldIds(await collection.getFields())
    if (imageFieldIds.length === 0) continue

    const items = await collection.getItems()
    for (const item of items) {
      for (const fieldId of imageFieldIds) {
        const fieldValue = item.fieldData[fieldId]
        const asset = getFieldImageAsset(fieldValue)
        const altText = asset?.altText?.trim() ?? ""
        if (asset && !altText) {
          results.push({
            checkId: `cms-alt-missing-${item.id}-${fieldId}`,
            category: "media",
            status: "fail",
            weight: 1,
            message: `CMS image in ${collection.name}/${item.slug} is missing alt text.`,
            affectedNodes: [item.id],
            issue: {
              id: `cms-alt-missing-${item.id}-${fieldId}`,
              category: "media",
              severity: "critical",
              title: "Missing CMS image alt text",
              description: `The image field "${fieldId}" on "${item.slug}" is missing alt text.`,
              cmsItemId: item.id,
              fixType: "auto-ai",
              aiFixAvailable: true,
            },
            metadata: { collectionId: collection.id, fieldId, imageUrl: asset.url },
          })
        }
      }
    }
  }

  if (results.length === 0) {
    results.push({
      checkId: "alt-text-ok",
      category: "media",
      status: "pass",
      weight: 1,
      message: "All detected images have usable alt text.",
      affectedNodes: [],
    })
  }

  return results
}
