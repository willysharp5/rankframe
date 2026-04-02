# RankFrame — Codex/Claude Code Build Prompt

**Use this prompt to kick off the build. Give the agent access to the project folder and reference the docs below.**

---

## The Prompt

```
You are building "RankFrame" — an AI-powered SEO plugin for Framer (website builder).

## Reference Documents (READ ALL BEFORE CODING)

1. **PRD.md** — Product requirements, features, user flows, pricing
2. **TECHNICAL.md** — Full technical architecture, data models, API usage, 22-step build plan
3. **DESIGN.md** — UI/UX specs, color system, component designs, tab layouts, animations

## What You're Building

A Framer plugin (React + TypeScript + Vite) that runs as a floating panel inside Framer's editor. It has 6 tabs:

1. **Audit** — One-click SEO + GEO dual scoring with AI-powered fix buttons
2. **Content Score** — NLP-powered content analysis (like SurferSEO's Content Score)
3. **Meta Editor** — Bulk CMS meta title/description editor with AI generation
4. **Schema** — AI smart JSON-LD schema generator with auto-detection
5. **Links** — Internal link analysis with AI contextual link suggestions
6. **Dashboard** — Dual score overview, trends, page breakdown

## Tech Stack

- **Framework:** React 18 + TypeScript (strict)
- **Build:** Vite
- **Plugin SDK:** `framer-plugin` (npm)
- **AI:** Vercel AI SDK (`ai` + `@ai-sdk/openai`) + Zod for structured output
- **NLP:** wink-nlp (browser-safe, 10KB)
- **Schema Types:** schema-dts
- **UI Components:** Tremor (@tremor/react) — primary component library for charts, tables, cards, progress bars, tabs. Dark mode built-in.
- **Styling:** Tailwind CSS (via @tailwindcss/vite plugin) — Tremor requires Tailwind
- **Charts:** Recharts (dependency of Tremor)
- **Icons:** Lucide React

## Build Order (Follow TECHNICAL.md Phases)

### Phase 1: Scaffold (Steps 1-3)
- `npm create framer-plugin@latest framer-seo-plugin`
- Install deps: `npm install ai @ai-sdk/openai zod wink-nlp wink-eng-lite-web-model schema-dts @tremor/react recharts tailwindcss @tailwindcss/vite lucide-react`
- Set up project structure per TECHNICAL.md Section 6

### Phase 2: Core Engine (Steps 4-9)
- Type definitions (engine/types.ts)
- All checkers: Heading, AltText, Meta, Schema, Link, Content, GEO, EEAT
- Score engine (dual SEO + GEO scoring)
- AI Service layer (using Vercel AI SDK generateObject/generateText)

### Phase 3: UI Components (Steps 10-15)
- Follow DESIGN.md exactly for colors, spacing, components
- Build DualScoreBadge with SVG progress rings
- Build all 6 tab views
- All AI buttons use purple accent, shimmer loading state

### Phase 4: Services (Steps 16-18)
- OpenAI service (via Vercel AI SDK)
- License/credits service
- Framer helper wrappers

### Phase 5: Assembly (Steps 19-21)
- Wire up App.tsx with 6 tabs
- Plugin data persistence
- Tests

### Phase 6: Build (Step 22)
- Production build, test in Framer

## Key Design Rules (from DESIGN.md)

- Dark theme matching Framer editor: bg #1a1a1a, cards #222222
- SEO Score = Blue (#3b82f6), GEO Score = Purple (#a855f7)
- AI features indicated with subtle 🤖 icon + purple accent
- Score rings: SVG circles with animated stroke-dasharray
- Score count-up animation on first render (1.5s ease-out)
- Issue cards: left border colored by severity, "🤖 AI Fix" buttons
- NO generic AI design — no gradients, no glow, no ChatGPT bubbles
- Quality level: Linear/Vercel/Raycast

## Critical Constraints

- Plugin runs in browser sandbox (iframe) — no Node.js APIs
- Bundle size matters — every KB affects load time in Framer
- Tailwind CSS + Tremor components for UI (Tremor requires Tailwind)
- Use framer-plugin API for all editor interactions
- AI calls via Vercel AI SDK generateObject() with Zod schemas
- wink-nlp preprocesses content locally before sending to OpenAI

## Start with Phase 1 and work through each phase sequentially. 
## Reference the specific TECHNICAL.md section for each step.
## Follow DESIGN.md for all UI decisions.
```

---

## File Checklist for the Agent

Make sure the coding agent has access to these files:

| File | Purpose | Location |
|------|---------|----------|
| `PRD.md` | What to build (features, user flows) | plans/framer-seo/PRD.md |
| `TECHNICAL.md` | How to build it (architecture, code, build steps) | plans/framer-seo/TECHNICAL.md |
| `DESIGN.md` | How it looks (UI specs, colors, layouts) | plans/framer-seo/DESIGN.md |
| `MARKETING.md` | Go-to-market (for context, not needed for build) | plans/framer-seo/MARKETING.md |

---

## Tips for Best Results

1. **Use Codex with `--full-auto`** or **Claude Code with `--permission-mode bypassPermissions --print`** for fastest iteration
2. **Start in a fresh git repo** — `git init` before running the agent
3. **Give it one phase at a time** if the full prompt is too much context. Break it into 6 sessions.
4. **Review after Phase 2** (core engine) before moving to UI — the engine is the foundation
5. **Test in Framer** after Phase 3 — open the dev plugin to verify UI renders correctly
6. **The TECHNICAL.md has complete code examples** for every major feature — the agent should reference these, not reinvent

---

## Alternative: Phase-by-Phase Prompts

If you want to break it into smaller sessions:

### Session 1: Scaffold + Engine
```
Build Phase 1 (scaffold) and Phase 2 (core engine) of the RankFrame Framer plugin.
Reference: TECHNICAL.md sections 1-5, steps 1-9.
Focus on: types, checkers, score engine, AI service layer.
Don't build UI yet.
```

### Session 2: UI Components
```
Build Phase 3 (UI) of the RankFrame Framer plugin.
Reference: DESIGN.md for all visual specs, TECHNICAL.md steps 10-15.
The engine from Phase 2 is already built in src/engine/ and src/ai/.
Build all 6 tabs and shared components.
```

### Session 3: Integration + Polish
```
Build Phase 4-6 of the RankFrame Framer plugin.
Wire up services, App.tsx routing, plugin data persistence, tests.
Reference: TECHNICAL.md steps 16-22.
```
