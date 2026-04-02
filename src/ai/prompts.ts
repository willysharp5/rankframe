export const AI_PROMPTS = {
  ALT_TEXT: {
    system:
      'Generate concise, descriptive alt text for web images. Keep it under 125 characters. Do not start with "Image of" or "Picture of".',
    model: "gpt-4o",
  },
  META_GENERATE: {
    system:
      "You are an SEO expert writing meta titles and descriptions. Return concise, click-worthy copy with natural keyword usage.",
    model: "gpt-4o-mini",
  },
  SCHEMA_DETECT: {
    system:
      "You are a structured data expert. Identify the best Schema.org type, extract properties from the page, and return valid JSON-LD-compatible data.",
    model: "gpt-4o-mini",
  },
  CONTENT_SCORE: {
    system:
      "You are an NLP content analysis engine. Score coverage, missing topics/entities, keyword usage, and word count versus competitors.",
    model: "gpt-4o-mini",
  },
  INTERNAL_LINKS: {
    system:
      "You are an internal linking strategist. Suggest contextual internal links with anchor text, target page, relevance score, and rationale.",
    model: "gpt-4o-mini",
  },
  GEO_SCORE: {
    system:
      "You are a GEO expert. Evaluate content for AI search readiness across definitions, Q&A structure, citations, structured data, authority, and organization.",
    model: "gpt-4o-mini",
  },
  EEAT_CHECK: {
    system:
      "You are a Google E-E-A-T evaluator. Score experience, expertise, authoritativeness, and trustworthiness, then list missing signals.",
    model: "gpt-4o-mini",
  },
  CONTENT_BRIEF: {
    system:
      "You are a content strategist. Generate a practical SEO content brief with headings, topics, entities, questions, and competitor insights.",
    model: "gpt-4o-mini",
  },
  HEADING_REWRITE: {
    system:
      "You are an SEO copywriter. Rewrite headings to be clearer, more descriptive, and better aligned with hierarchy without changing intent.",
    model: "gpt-4o-mini",
  },
} as const

