import { framer } from "framer-plugin"
import type { CheckResult } from "../types"

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateSchema(schema: Record<string, unknown>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (schema["@context"] !== "https://schema.org") {
    errors.push("Missing or invalid @context.")
  }
  if (typeof schema["@type"] !== "string") {
    errors.push("Missing @type property.")
  }

  switch (schema["@type"]) {
    case "Article":
      if (!schema.headline) errors.push("Article schema requires headline.")
      if (!schema.datePublished) errors.push("Article schema requires datePublished.")
      break
    case "Product":
      if (!schema.name) errors.push("Product schema requires name.")
      if (!schema.offers) warnings.push("Product schema should include offers.")
      break
    case "FAQPage":
      if (!Array.isArray(schema.mainEntity) || schema.mainEntity.length === 0) {
        errors.push("FAQPage schema needs at least one question.")
      }
      break
    default:
      break
  }

  return { valid: errors.length === 0, errors, warnings }
}

function extractFirstJsonObject(content: string): Record<string, unknown> | null {
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function analyzeSchema(): Promise<CheckResult[]> {
  const codeFiles = await framer.getCodeFiles()
  const schemaFiles = codeFiles.filter(
    (file) =>
      file.name.toLowerCase().includes("schema") ||
      file.content.includes("application/ld+json") ||
      file.content.includes('"@context"')
  )

  if (schemaFiles.length === 0) {
    return [
      {
        checkId: "schema-missing",
        category: "technical",
        status: "warning",
        weight: 1,
        message: "No JSON-LD schema markup was found in project code files.",
        affectedNodes: [],
        issue: {
          id: "schema-missing",
          category: "technical",
          severity: "warning",
          title: "Missing schema markup",
          description: "Add JSON-LD to improve rich results and AI readiness.",
          fixType: "auto-ai",
          aiFixAvailable: true,
        },
      },
    ]
  }

  const results: CheckResult[] = []
  for (const file of schemaFiles) {
    const schema = extractFirstJsonObject(file.content)
    if (!schema) {
      results.push({
        checkId: `schema-invalid-json-${file.id}`,
        category: "technical",
        status: "fail",
        weight: 1,
        message: `${file.name} looks like schema markup but is not valid JSON.`,
        affectedNodes: [file.id],
        issue: {
          id: `schema-invalid-json-${file.id}`,
          category: "technical",
          severity: "critical",
          title: "Invalid schema JSON",
          description: `The schema file "${file.name}" could not be parsed as valid JSON-LD.`,
          fixType: "manual",
          aiFixAvailable: true,
        },
      })
      continue
    }

    const validation = validateSchema(schema)
    if (!validation.valid || validation.warnings.length > 0) {
      results.push({
        checkId: `schema-validation-${file.id}`,
        category: "technical",
        status: validation.valid ? "warning" : "fail",
        weight: 1,
        message: `${file.name} has ${validation.errors.length} errors and ${validation.warnings.length} warnings.`,
        affectedNodes: [file.id],
        issue: {
          id: `schema-validation-${file.id}`,
          category: "technical",
          severity: validation.valid ? "warning" : "critical",
          title: validation.valid ? "Schema warnings" : "Invalid schema markup",
          description: [...validation.errors, ...validation.warnings].join(" "),
          fixType: "auto-ai",
          aiFixAvailable: true,
        },
      })
      continue
    }

    results.push({
      checkId: `schema-valid-${file.id}`,
      category: "technical",
      status: "pass",
      weight: 1,
      message: `${file.name} contains valid schema markup.`,
      affectedNodes: [file.id],
    })
  }

  return results
}

