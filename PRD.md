# Framer SEO Power Tool — Product Requirements Document

**Version:** 2.0 (AI-Enhanced)  
**Date:** March 29, 2026  
**Status:** Ready for Development  
**Updated:** Added AI-first features based on competitive research (Surfer, Frase, RankMath, Semrush, etc.)

---

## 1. Product Vision

**What:** An AI-powered SEO auditing, optimization, and monitoring plugin built natively for Framer's editor. It gives designers, founders, and agencies real-time visibility into every SEO issue — and AI-driven tools to fix them automatically. **The first Framer plugin that optimizes for BOTH Google AND AI search engines.**

**Who:** Anyone building on Framer who cares about organic search traffic. Primary: solo founders and site owners. Secondary: agencies managing multiple Framer client sites. Tertiary: freelance web designers delivering SEO-optimized projects.

**Why:** Framer sites look incredible but rank terribly. The platform's SEO tooling is surface-level — basic meta tag fields and auto-generated sitemaps. There is no native heading hierarchy checker, no bulk alt text management, no schema markup support, no internal link analysis, and no orphan page detection. Existing marketplace plugins (Semflow, FrameSEO, OptiScope) offer fragmented, shallow audits. None provide the depth of Yoast/RankMath for WordPress — and NONE optimize for the AI search revolution (ChatGPT, Perplexity, Google AI Overviews). This plugin fills both gaps — it's the SEO toolkit Framer should have built, plus the GEO toolkit nobody else has.

---

## 2. Target Users

| Tier | Who | Size | Why They Pay |
|------|-----|------|-------------|
| **Primary** | Framer site owners (founders, marketers, bloggers) | Thousands — every Framer site with a blog or CMS | They're losing rankings and don't know why. Need actionable fixes. |
| **Secondary** | Agencies building client sites on Framer | Hundreds of agencies, managing 5-50 sites each | Need to deliver SEO audits to clients. White-label reports justify agency fees. |
| **Tertiary** | Freelance web designers | Thousands of freelancers | Differentiate from competitors by delivering SEO-optimized sites. |

---

## 3. User Personas

### Persona 1: Sarah — SaaS Founder
- **Age:** 32 | **Role:** CEO & solo founder | **Technical:** Low-to-medium
- **Framer Usage:** Built her SaaS landing page + blog herself using a Framer template
- **Pain Points:**
  - Published 40 blog posts but gets almost zero organic traffic
  - Doesn't know her blog uses infinite scroll (which Google can't crawl)
  - Has 15 images with missing alt text she doesn't know about
  - Tried to add schema markup but has no idea how
  - Competitor with worse content ranks above her
- **What she wants:** "Show me what's broken and help me fix it in 5 minutes"
- **Willingness to pay:** $19/mo without hesitation if it moves the needle

### Persona 2: Marcus — Agency Creative Director
- **Age:** 38 | **Role:** Runs a 6-person design agency | **Technical:** Medium
- **Framer Usage:** Agency builds 3-5 client sites per month on Framer
- **Pain Points:**
  - Clients ask for "SEO optimization" and he doesn't have a systematic process
  - Manually checks meta titles page-by-page across 30+ page sites
  - No way to generate branded SEO reports for client deliverables
  - One client's site has 200+ CMS items with duplicate meta descriptions
  - Needs to manage SEO across 20+ active client sites
- **What he wants:** "Audit all pages in one click, bulk-fix issues, export a PDF report"
- **Willingness to pay:** $49/mo for agency tier with multi-site + team features

### Persona 3: Priya — Freelance Web Designer
- **Age:** 26 | **Role:** Freelance designer, specializing in Framer | **Technical:** Medium-high
- **Framer Usage:** Builds portfolio sites, landing pages, and small business sites
- **Pain Points:**
  - Clients blame her when their site doesn't rank
  - Spends 2+ hours manually checking SEO on each project before handoff
  - Has no structured SEO checklist for Framer specifically
  - Doesn't know which heading hierarchy issues cause ranking problems
  - Wants to charge more for "SEO-optimized" sites but can't prove the value
- **What she wants:** "A professional SEO score I can show clients before delivering the site"
- **Willingness to pay:** $19/mo — it saves her hours and justifies higher project fees

---

## 4. Core Problem Statement

**Framer sites have a systemic SEO problem, and the ecosystem offers no comprehensive solution.**

Specific documented issues (sourced from Reddit r/framer, r/TechSEO, r/digital_marketing, Framer Community forums):

1. **Blog posts loaded via infinite scroll** — Google cannot discover or index dynamically loaded content
2. **No pagination options** for CMS listing pages — all items load on one page or not at all
3. **Limited metadata editing** — editing meta titles/descriptions for individual CMS items is tedious and lacks bulk operations
4. **Zero schema markup support** — no way to add JSON-LD for articles, products, FAQs, or organization data
5. **Alt text neglect** — images across the canvas frequently lack alt text; there's no bulk detection or fix tool
6. **Heading hierarchy chaos** — designers use H1-H6 for visual sizing, not semantic structure, breaking SEO
7. **Orphan pages** — pages exist but have zero internal links pointing to them, making them invisible to search engines
8. **No SEO dashboard** — site owners have no way to see their overall SEO health at a glance

Existing competitors are shallow:
- **Semflow** — general audit + keyword tools, but unclear on Framer-specific issues, opaque pricing
- **FrameSEO** — basic auditing, limited automation, single-developer plugin
- **OptiScope** — "enterprise-level" marketing but light on actual features, no CMS bulk editing
- **BlogSEO / SEObot** — content generation tools, not SEO auditing/optimization
- **None** offer: bulk CMS meta editing, AI alt text generation, schema markup injection, or heading hierarchy fixing

---

## 5. MVP Feature Set (v1.0) — Ships in 2-3 Weeks

### 5.1 One-Click SEO Audit Score
- Scan any page or the entire site
- **Dual Score: SEO Score + GEO Score** (Google optimization + AI search readiness)
- Score 0-100 based on weighted criteria (meta tags, headings, alt text, links, schema, performance signals, AI-readiness)
- Color-coded results: 🟢 Good (80-100) | 🟡 Needs Work (50-79) | 🔴 Critical (0-49)
- Issue list with severity, description, and **AI-powered one-click fix** where possible
- Score breakdown by category: Content, Technical, Links, Media, **AI Readiness**

### 5.2 Missing Alt Text Detector + AI Auto-Generation
- Scan all images across canvas pages and CMS content
- Flag images with missing or empty alt text
- "Fix All" button: uses OpenAI API (GPT-4o-mini) to analyze image context and generate descriptive, keyword-rich alt text
- Preview generated alt text before applying
- Batch apply to all flagged images
- **AI understands page context** — alt text is relevant to surrounding content, not just generic image descriptions

### 5.3 Heading Hierarchy Checker
- Visualize the heading structure (H1 → H2 → H3) as a tree
- Flag violations: missing H1, multiple H1s, skipped levels (H1 → H3), incorrect nesting
- Show which text nodes map to which heading levels
- Highlight issues directly on the canvas via `framer.navigateTo()`
- **AI-suggested fixes** — not just "Change this H3 to H2" but rewritten heading text optimized for target keywords

### 5.4 AI Meta Title/Description Generator + Bulk Editor
- List all pages and CMS items with their current meta titles and descriptions
- Inline editing directly in the plugin panel
- Character count with Google SERP preview (title: 50-60 chars, description: 150-160 chars)
- **🤖 AI Generate button** — one-click AI generation of meta titles and descriptions using page content + target keyword. Writes click-worthy, keyword-optimized copy.
- **Bulk AI Generate** — select multiple CMS items → AI generates unique, optimized meta for each based on their individual content
- Bulk edit: select multiple items → apply template patterns (e.g., "{title} | {site_name}")
- Flag: missing, too short, too long, duplicate meta tags

### 5.5 AI Smart Schema Generator (JSON-LD)
- Select a page → **AI auto-detects the best schema type** based on page content (Article, Product, FAQ, Organization, LocalBusiness, BreadcrumbList, HowTo, Recipe, Event, etc.)
- AI reads page content and **auto-fills all schema properties** — no manual mapping needed
- Form-based editor for review and manual adjustments
- Auto-generates valid JSON-LD
- Injects schema via Code Files API (creates/updates a code override file)
- Validates schema against Google's Rich Results test format
- Preview the structured data before injection
- **FAQ schema extraction** — AI identifies Q&A patterns in content and auto-generates FAQ schema

### 5.6 AI Internal Link Suggestions
- Build a link graph of all pages
- Identify orphan pages (zero inbound internal links)
- Show link count per page (inbound + outbound)
- Highlight pages with too few internal links
- **🤖 AI Link Genius** — AI analyzes content across all pages and suggests contextual internal links with specific anchor text recommendations
- **Auto-link keywords** — define keyword-to-URL mappings, AI suggests variations and related terms to link
- One-click "Add Link" to insert suggested internal links directly into CMS content

### 5.7 AI Content Score (Real-Time)
- **🤖 NEW: NLP-powered content scoring** — like SurferSEO's Content Score, but built into Framer
- Enter a target keyword for any page/CMS item
- AI analyzes top-ranking pages for that keyword and compares your content
- Shows: topic coverage %, missing entities/topics, keyword density, content length comparison
- **Real-time score updates** as the user edits content in CMS
- Recommendations: "Add a section about [X]" / "Mention [entity] at least 2 times" / "Your content is 800 words — top pages average 2,100"
- Content grade: A+ through F based on competitive completeness

### 5.8 SEO Score Dashboard
- Site-wide overview: overall SEO score + GEO score, page count, issues by severity
- Per-page breakdown table sortable by score, issues, page type
- Trend tracking: score changes over time (stored in plugin data)
- Quick-action buttons: "Fix highest impact issues first" with AI auto-fix
- Export: copy audit summary to clipboard

---

## 6. V1.1 AI Features (Week 3-4)

| Feature | Description | Value |
|---------|-------------|-------|
| **GEO Score (AI Search Readiness)** | Score each page on how well it's structured for AI citation. Checks: clear Q&A format, structured data, authoritative statements, citation-friendly formatting, source attribution. Recommendations to improve AI visibility. | **First-mover advantage** — NO Framer plugin does this. Frase charges $49/mo just for GEO. |
| **E-E-A-T Checker** | AI evaluates pages against Google's Experience, Expertise, Authoritativeness, Trustworthiness signals. Checks: author info present, credentials shown, sources cited, dates visible, about page linked, contact info accessible. Scores each E-E-A-T dimension. | Only Page Optimizer Pro ($40/mo) does this. Unique in Framer ecosystem. |
| **AI Content Gap Analysis** | Enter target keyword → AI analyzes top 10 ranking pages → shows topics/entities/questions your content is missing. "Your page about X doesn't mention [A, B, C] that all top pages cover." | Directly drives content improvements. SurferSEO's core feature. |
| **AI Content Brief Generator** | Enter a keyword → get a full content brief: target word count, required topics/entities, suggested H2/H3 headings, questions to answer, competitor insights. | Agencies would upgrade for this alone. Frase/MarketMuse charge $49-149/mo for this. |

## 6.1 V2 Features (Month 2-3)

| Feature | Description | Value |
|---------|-------------|-------|
| **Image Filename Optimizer** | Flag images with generic filenames (IMG_001.jpg) and suggest SEO-friendly names | Images rank in Google Image Search |
| **Sitemap Validator** | Parse and validate the auto-generated Framer sitemap, flag issues | Ensures all pages are discoverable |
| **Blog Pagination Helper** | Detect infinite scroll patterns, provide guidance on pagination best practices | Fixes the #1 Framer SEO killer |
| **AI Competitor SEO Comparison** | Enter a competitor URL → AI crawls and compares their SEO vs yours side-by-side: meta tags, schema, headings, content depth, backlink estimates, AI readiness | Motivates upgrades, creates urgency |
| **SEO Monitoring & Alerts** | Track ranking changes, crawl errors, SEO regressions over time. Email/in-app alerts when score drops or new issues appear. | Reduces churn, keeps users engaged |
| **Weekly AI SEO Report** | Automated email reports with score changes, new issues, fixed issues, AI search visibility trends | Keeps users engaged, reduces churn |
| **Open Graph / Social Preview** | Preview how pages look when shared on X, LinkedIn, Facebook. AI-generated OG descriptions. | Improves social sharing click-through |
| **Canonical URL Manager** | Set and validate canonical URLs for all pages | Prevents duplicate content issues |
| **301 Redirect Manager** | Manage redirects for deleted/moved pages | Preserves link equity during site changes |
| **AI Bot Crawler Optimization** | Analyze how AI bots (GPTBot, ClaudeBot, PerplexityBot) see your site. Ensure content is accessible to AI crawlers. Manage robots.txt for AI bots. | Future-proofing for AI search era |

---

## 7. User Flows

### Flow 1: Install → First Audit → Fix Issues

```
1. User finds plugin on Framer Marketplace
2. Clicks "Install" → plugin appears in their toolbar
3. Opens plugin → sees "Run Your First Audit" CTA
4. Clicks "Audit This Page" or "Audit Entire Site"
5. Loading state with progress indicator (scanning pages...)
6. Results appear: SEO Score (e.g., 62/100 🟡)
7. Issue list sorted by impact:
   - 🔴 Critical: 8 images missing alt text
   - 🔴 Critical: No H1 tag on homepage
   - 🟡 Warning: Meta descriptions too short on 12 pages
   - 🟡 Warning: 3 orphan pages detected
8. User clicks "Fix" on alt text issue
9. AI generates alt text suggestions → user reviews → applies
10. Score updates in real-time: 62 → 71
11. User continues fixing → dopamine loop
```

### Flow 2: Bulk Edit Meta Descriptions for CMS

```
1. User opens plugin → navigates to "Meta Editor" tab
2. Sees table: Page Name | Meta Title | Meta Description | Score
3. Filters by: CMS Collection (e.g., "Blog Posts")
4. Sees 45 blog posts, 30 with missing descriptions
5. Selects all 30 with missing descriptions
6. Clicks "Bulk Edit" → template editor appears
7. Sets template: "{post_title} - Learn about {category} | MySite"
8. Previews generated descriptions with SERP preview
9. Clicks "Apply to Selected"
10. All 30 posts updated instantly via CMS API
11. Audit score improves from 58 → 78
```

### Flow 3: Generate Schema Markup for a Page

```
1. User navigates to a blog post page on canvas
2. Opens plugin → navigates to "Schema" tab
3. Plugin detects page type (CMS-backed blog post)
4. Suggests "Article" schema type
5. Auto-fills fields from CMS data:
   - headline → CMS title
   - datePublished → CMS date
   - author → CMS author field
   - image → CMS featured image
6. User reviews and edits as needed
7. Clicks "Generate & Inject"
8. Plugin creates a code override file with JSON-LD
9. Shows validation result: ✅ Valid Article schema
10. User can test with Google Rich Results preview link
```

### Flow 4: AI Content Score — Optimize a Blog Post

```
1. User opens a blog post CMS item
2. Opens plugin → navigates to "Content Score" tab
3. Enters target keyword: "best project management tools"
4. Plugin shows: Content Score 34/100 (D+)
5. Breakdown:
   - Topic Coverage: 28% (missing 14 of 20 key topics)
   - Word Count: 800 words (top pages average 2,100)
   - Keyword Density: 0.3% (target: 1-2%)
   - Missing Entities: "Gantt chart", "Agile", "Kanban", "sprint planning"
6. Recommendations panel:
   - 🔴 "Add section about Gantt charts and visual planning"
   - 🔴 "Mention Agile/Scrum methodology"
   - 🟡 "Increase word count to 1,800+ words"
   - 🟡 "Add comparison table of tools"
7. User edits content → score updates in real-time
8. Score climbs: 34 → 52 → 71 → 86
9. User sees they now cover 85% of topics top pages cover
```

### Flow 5: GEO Score — Optimize for AI Search

```
1. User runs full site audit → sees GEO Score alongside SEO Score
2. Homepage: SEO 78/100, GEO 42/100 🔴
3. Clicks into GEO details:
   - ❌ No FAQ schema (AI engines love structured Q&A)
   - ❌ No clear "what is" definitions (AI engines cite these)
   - ❌ No source citations (AI engines prefer cited content)
   - 🟡 Headings not in question format (AI engines prefer Q&A structure)
   - ✅ Has author bio (good for authority)
4. Recommendations:
   - "Add an FAQ section with 5+ questions about your product"
   - "Include a clear definition paragraph starting with '[Product] is...'"
   - "Add source citations/links to back up claims"
   - "Restructure 3 headings as questions (e.g., 'What is X?' instead of 'About X')"
5. User implements fixes → GEO Score: 42 → 73
6. Dashboard shows: "Your site is now optimized for both Google and AI search engines"
```

### Flow 6: AI Internal Link Suggestions

```
1. User opens plugin → navigates to "Links" tab
2. AI has analyzed all 45 pages on the site
3. Dashboard shows:
   - 🔴 3 orphan pages (zero inbound links)
   - 🟡 12 pages with <2 internal links
   - 🤖 47 AI-suggested internal links
4. User clicks "View Suggestions"
5. Sees contextual recommendations:
   - Blog post "How to Scale Your Startup" → link "project management" to /tools page
   - About page → link "our methodology" to /blog/agile-approach
   - Pricing page has 0 links to case studies → suggest 3 links
6. Each suggestion shows: source page, anchor text, target page, relevance score
7. User clicks "Add Link" → link is inserted into CMS content
8. Bulk option: "Add all high-confidence links (85%+ relevance)"
```

---

## 8. Pricing Strategy

### Freemium Model

| | **Free** | **Pro** | **Agency** |
|---|---------|---------|-----------|
| **Price** | $0 | $19/mo | $49/mo |
| **Billing** | — | Monthly or $190/yr (save 17%) | Monthly or $490/yr (save 17%) |
| **Pages Audited** | 5 pages | Unlimited | Unlimited |
| **SEO Audit** | ✅ Basic score | ✅ Full detailed audit | ✅ Full detailed audit |
| **GEO Score (AI Readiness)** | ✅ View only | ✅ Full + recommendations | ✅ Full + recommendations |
| **AI Content Score** | ❌ | ✅ Full NLP analysis | ✅ Full NLP analysis |
| **Alt Text Detection** | ✅ Detect only | ✅ AI auto-generate | ✅ AI auto-generate |
| **Heading Checker** | ✅ | ✅ + AI rewrite suggestions | ✅ + AI rewrite suggestions |
| **Meta Editor** | ❌ View only | ✅ Edit + AI Generate + Bulk | ✅ Edit + AI Generate + Bulk |
| **Schema Generator** | ❌ | ✅ AI auto-detect + all types | ✅ AI auto-detect + all types |
| **AI Internal Links** | ❌ | ✅ AI suggestions + auto-link | ✅ AI suggestions + auto-link |
| **E-E-A-T Checker** | ❌ | ✅ | ✅ |
| **AI Content Brief** | ❌ | 5/mo | Unlimited |
| **AI Content Gap Analysis** | ❌ | ✅ | ✅ |
| **Competitor Comparison** | ❌ | ❌ | ✅ AI-powered |
| **Dashboard** | Basic (1 page) | ✅ Full site | ✅ Full site |
| **Sites** | 1 site | 1 site | Up to 10 sites |
| **Team Members** | 1 | 1 | Up to 5 |
| **Export Reports** | ❌ | ✅ | ✅ White-label |
| **Priority Support** | ❌ | ❌ | ✅ |
| **AI Credits/mo** | 10 actions | 500 actions | 2,000 actions |

### Pricing Rationale
- **$19/mo Pro** — Undercuts every AI SEO tool: SurferSEO ($89), Frase ($49), Scalenut ($30), NeuronWriter ($23). Delivers comparable AI features at Framer-native convenience. Could justify $29/mo once AI features prove value.
- **$49/mo Agency** — Justified by multi-site management, white-label reports, unlimited AI content briefs, and competitor comparison. Agencies charge $2,000-$10,000 per site; $49/mo is a rounding error.
- **Free tier** — Critical for adoption. Framer Marketplace users expect to try before buying. The 5-page limit + 10 AI actions creates natural upgrade pressure.
- **AI Credits** — AI features (content score, meta generation, content briefs, alt text generation) consume credits. This controls API costs while giving generous allowances. 500 actions/mo covers most solo users easily.

### Payment Infrastructure
- Stripe for subscriptions (monthly + annual)
- License key validation via backend API
- Grace period: 7 days after failed payment before downgrade

---

## 9. Success Metrics

### Month 1 Targets
| Metric | Target | How We Measure |
|--------|--------|---------------|
| Marketplace installs | 1,000 | Framer Marketplace dashboard |
| Active users (opened plugin 2+ times) | 400 | Internal analytics |
| Free → Pro conversion | 5% (50 users) | Stripe dashboard |
| Average audit score improvement | +15 points | Plugin analytics |

### Month 3 Targets
| Metric | Target |
|--------|--------|
| Total installs | 3,000 |
| Paid users (Pro + Agency) | 100 |
| MRR | $2,000+ |
| Marketplace rating | 4.8+ stars |
| Churn rate | <5% monthly |

### Month 6 Targets
| Metric | Target |
|--------|--------|
| Total installs | 8,000 |
| Paid users | 400+ |
| MRR | $10,000+ |
| NPS score | 50+ |

### North Star Metric
**Average SEO score improvement per user** — If users' sites get measurably better, everything else follows: retention, word-of-mouth, upgrades, reviews.

---

## 10. Competitive Analysis

### Current Framer SEO Plugin Landscape

| Plugin | Features | Weaknesses | Our Advantage |
|--------|----------|-----------|---------------|
| **Semflow** | Site audit, SEO score, keyword research, PageSpeed integration | Opaque pricing, unclear Framer-specific depth, no CMS bulk editing, no schema injection | We go deeper on Framer-specific issues (headings, alt text, CMS meta), include AI-powered fixes, and offer transparent pricing |
| **FrameSEO** | Basic SEO auditing and optimization | Single developer, limited feature set, no AI, no bulk operations | Comprehensive feature suite, actively developed, AI alt text, schema generator |
| **OptiScope** | "Enterprise-level" marketing, real-time SEO analysis, LLM optimization | Feature depth unclear, enterprise positioning may scare solo users | Clear feature list, accessible pricing, proven value at $19/mo |
| **BlogSEO / SEObot** | AI content generation, blog writing | Content creation ≠ SEO optimization. Different problem space. | We optimize what you already have, not generate more content |
| **Fathom Analytics** | Privacy-first analytics | Analytics ≠ SEO tooling. Complementary, not competitive. | Different category entirely — we address SEO optimization |

### Why We Win

1. **Framer-native depth** — We don't just scrape the published site. We use Framer's Plugin APIs (Nodes, CMS, Code Files, Sites) to read and write directly inside the editor. Fix issues without leaving Framer.

2. **AI-powered fixes, not just reports** — Not just "here are your problems." We fix them. AI alt text generation, AI meta writing, AI content scoring, AI schema detection, AI internal link suggestions. Every audit item has an AI-powered fix button.

3. **GEO + SEO dual optimization** — We're the ONLY Framer plugin that scores pages for both Google AND AI search engines (ChatGPT, Perplexity, Google AI Overviews). Competitors like Frase ($49/mo) and Semrush ($139/mo) are just adding this. We ship it at $19/mo.

4. **CMS-first approach** — Most Framer SEO problems live in the CMS (duplicate meta, missing descriptions, no schema on CMS pages). We treat CMS as a first-class citizen.

5. **Transparent pricing** — $0 / $19 / $49. No "contact for pricing." No enterprise sales calls. Install and go.

6. **Speed to value** — First audit in under 30 seconds. First AI-powered fix in under 60 seconds. Users see their score improve in real-time.

### Broader Market Context
- **Yoast (WordPress):** $99/yr, 13M+ installs. Proves the market for in-editor SEO tools is massive.
- **RankMath (WordPress):** Free + Pro at $59/yr. AI Link Genius and AI Content Writer drove massive adoption.
- **Surfer SEO:** $89-$219/mo. Content Score is the gold standard for NLP-based optimization.
- **Frase:** $49/mo. Leading the GEO wave — dual SEO + AI search optimization.
- **Semrush:** $139-499/mo. Just launched AI Visibility Toolkit — the market is moving.
- **Framer has NO equivalent.** We are building the Yoast + SurferSEO + Frase of Framer — and Framer is growing fast with 0% marketplace commission.

---

*End of PRD — Ready for Technical Planning and Development*
