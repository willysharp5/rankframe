# RankFrame Design Document

**Version:** 1.0
**Date:** April 2, 2026
**Purpose:** UI/UX specifications for Codex/Claude Code to build the plugin interface

---

## 1. Design Philosophy

**Core principles:**
- **Framer-native** — Blend seamlessly into Framer's dark editor. Not a foreign widget, an extension of the editor itself.
- **Linear/Vercel quality** — Clean, data-dense, minimal. Every pixel earns its space.
- **NOT generic AI** — No gradient blobs, no ChatGPT-style bubbles, no "✨ AI Magic ✨" cheese. AI features are indicated subtly with a small 🤖 icon or purple accent, not plastered everywhere.
- **Score-driven dopamine** — Scores animate up when you fix things. Progress feels tangible. Color transitions from red → yellow → green create satisfaction.
- **Information density** — This is a professional tool in a 380px panel. Show data compactly. Think Raycast, not a marketing page.

**Design references (study these):**
- **Linear** (linear.app) — Panel design, clean lists, minimal aesthetic, keyboard-first
- **Raycast** (raycast.com) — Floating panel UI, compact information density, dark mode done right
- **Vercel Dashboard** (vercel.com/dashboard) — Modern dark analytics, clean data presentation
- **SurferSEO Content Editor** — How they show content score as a sidebar gauge with topic chips
- **Ahrefs** — Data visualization, score presentation, severity color coding

---

## 2. Plugin Constraints

| Constraint | Value |
|-----------|-------|
| **Panel width** | 380px default (user-resizable) |
| **Panel height** | 600px default (user-resizable) |
| **Rendering** | React inside sandboxed iframe |
| **Background** | Must match Framer editor dark theme |
| **Styling** | CSS Modules (no Tailwind in plugin — bundle size) |
| **Fonts** | Use system font stack to match Framer: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto` |
| **Scrolling** | Plugin panel scrolls internally. Each tab manages its own scroll. |
| **No external CSS** | Everything self-contained. No CDN imports. |

---

## 3. Color System

### Base (matches Framer editor dark theme)
```css
:root {
  /* Backgrounds */
  --bg-primary: #1a1a1a;        /* Plugin panel background */
  --bg-secondary: #222222;       /* Card/section backgrounds */
  --bg-tertiary: #2a2a2a;        /* Hover states, subtle fills */
  --bg-elevated: #333333;        /* Modals, dropdowns */

  /* Text */
  --text-primary: #ffffff;        /* Headings, primary content */
  --text-secondary: #a0a0a0;     /* Descriptions, secondary info */
  --text-tertiary: #666666;      /* Disabled, placeholder */

  /* Borders */
  --border-default: #333333;     /* Dividers, card borders */
  --border-subtle: #2a2a2a;      /* Subtle separators */

  /* Score Colors */
  --score-excellent: #22c55e;    /* 80-100: Green */
  --score-good: #84cc16;         /* 70-79: Lime */
  --score-warning: #eab308;      /* 50-69: Yellow/Amber */
  --score-poor: #f97316;         /* 30-49: Orange */
  --score-critical: #ef4444;     /* 0-29: Red */

  /* Feature Accents */
  --accent-seo: #3b82f6;         /* SEO Score: Blue */
  --accent-geo: #a855f7;         /* GEO Score: Purple */
  --accent-ai: #a855f7;          /* AI features: Purple (subtle) */
  --accent-primary: #3b82f6;     /* Primary actions: Blue */

  /* Severity */
  --severity-critical: #ef4444;  /* Red dot/badge */
  --severity-warning: #eab308;   /* Yellow dot/badge */
  --severity-info: #3b82f6;      /* Blue dot/badge */
  --severity-pass: #22c55e;      /* Green check */
}
```

### AI Feature Indicator
AI-powered features use a subtle purple accent — a small `🤖` icon or purple left-border on cards. Never a gradient or glow. The purple is the same shade as the GEO Score, creating visual consistency: purple = AI/future-focused.

---

## 4. Component Specifications

### 4.1 Dual Score Badge (Hero Component)

The most important visual. Shown at the top of the Audit tab and Dashboard.

```
┌─────────────────────────────────────┐
│                                     │
│    ┌─────────┐   ┌─────────┐       │
│    │   72    │   │   48    │       │
│    │  /100   │   │  /100   │       │
│    │  SEO    │   │  GEO    │       │
│    └─────────┘   └─────────┘       │
│     ● Needs Work   ● Critical      │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**
- Two circular progress rings side by side (SVG `<circle>` with `stroke-dasharray` animation)
- SEO ring: Blue accent (`--accent-seo`)
- GEO ring: Purple accent (`--accent-geo`)
- Score number animates up from 0 on first render (count-up animation, 1.5s ease-out)
- Ring fills clockwise proportional to score
- Status label below each: "Excellent" / "Good" / "Needs Work" / "Critical"
- Ring stroke color matches score range (green/yellow/red)

**Inspiration:** Vercel's deployment score circles, Lighthouse score gauges, but more refined.

### 4.2 Issue Card

```
┌─────────────────────────────────────┐
│ 🔴 Missing H1 tag                  │
│ Every page should have exactly one  │
│ H1 tag. This page has none.        │
│                                     │
│ [Go to ↗]          [🤖 AI Fix]     │
└─────────────────────────────────────┘
```

**Implementation:**
- Left border color matches severity (red/yellow/blue)
- Severity dot: small 8px colored circle
- Title: bold, `--text-primary`
- Description: `--text-secondary`, max 2 lines with ellipsis
- Buttons: ghost-style, right-aligned
- "🤖 AI Fix" button has subtle purple text color
- On hover: card background lifts to `--bg-tertiary`
- After fix applied: card animates to green border with ✅, then fades/collapses

### 4.3 Tab Navigation

```
┌─────────────────────────────────────┐
│ [Audit] [Content] [Meta]           │
│ [Schema] [Links] [Dashboard]       │
└─────────────────────────────────────┘
```

**Implementation:**
- Horizontal pill tabs, two rows of 3 (380px is tight for 6 tabs in one row)
- Active tab: solid background `--bg-tertiary`, white text
- Inactive: transparent, `--text-secondary`
- Small icons before labels (optional, reduces label confusion):
  - Audit: 🔍, Content: 📊, Meta: 📝, Schema: { }, Links: 🔗, Dashboard: 📈
- Tabs are 12px font, compact padding
- Alternative: scrollable single row with subtle left/right fade

### 4.4 Data Table (Meta Editor, Link Analysis)

```
┌─────────────────────────────────────┐
│ Page          Title    Desc   Score │
│─────────────────────────────────────│
│ /about        ✅ 52ch  ⚠️ 89ch  78 │
│ /blog/post-1  ❌ —     ❌ —     12 │
│ /pricing      ✅ 48ch  ✅ 142ch  92 │
│ /contact      ⚠️ 65ch  ✅ 156ch  68 │
└─────────────────────────────────────┘
```

**Implementation:**
- Compact table with fixed header
- Alternating row backgrounds (`--bg-primary` / `--bg-secondary`)
- Status icons: ✅ green check, ⚠️ yellow warning, ❌ red X
- Score column: number with colored background pill (green/yellow/red)
- Clicking a row expands it inline to show edit fields
- Sortable columns (click header to sort)
- Row hover: slight highlight

### 4.5 Content Score Panel

```
┌─────────────────────────────────────┐
│ Content Score       🤖 AI-Powered   │
│                                     │
│ Target: "best project management"   │
│                                     │
│ ┌─────────────────────────┐        │
│ │         62 / B-         │        │
│ │     ████████░░░░        │        │
│ └─────────────────────────┘        │
│                                     │
│ Topic Coverage         65%  ████▓░░ │
│ Word Count        800/2100  ███░░░░ │
│ Keyword Density    0.3/1.5% █░░░░░░ │
│                                     │
│ Missing Topics:                     │
│ [Gantt chart] [Agile] [Kanban]     │
│ [sprint planning] [roadmap]         │
│                                     │
│ 🔴 Add section about Gantt charts  │
│ 🔴 Mention Agile methodology       │
│ 🟡 Increase word count to 1,800+   │
└─────────────────────────────────────┘
```

**Implementation:**
- Large score number centered with letter grade beside it
- Horizontal progress bar below score (fills left-to-right, colored by score range)
- Metric rows: label left, value + mini progress bar right
- Missing topics as tag chips: rounded pill shapes, `--bg-tertiary` background, clicking copies to clipboard
- Recommendations as issue-style cards below (sorted by priority)

### 4.6 SERP Preview

```
┌─────────────────────────────────────┐
│ Google Preview                      │
│                                     │
│ Best Project Management Tools 2026  │
│ https://mysite.com › blog › pm-tools│
│ Discover the top project management │
│ tools for teams. Compare features,  │
│ pricing, and find the perfect...    │
│                                     │
│ Title: 48/60 ✅   Desc: 142/160 ✅  │
└─────────────────────────────────────┘
```

**Implementation:**
- Mimics actual Google SERP styling but in dark mode
- Title: `#8ab4f8` (Google blue in dark mode), 18px
- URL: `#bdc1c6`, 14px, breadcrumb style
- Description: `--text-secondary`, 14px
- Character counters below with color coding

### 4.7 AI Action Button Styles

Three button variants for AI actions:

```
[🤖 AI Fix]           — Ghost button, purple text. For individual issue fixes.
[🤖 Generate All]     — Solid purple button. For bulk AI operations.
[🤖 Analyze]          — Outlined purple button. For triggering AI analysis.
```

- All AI buttons include a subtle loading state: purple shimmer animation while AI is processing
- After completion: brief green flash, then return to normal
- Credits badge appears near bulk buttons: "12 credits"

### 4.8 Credits Badge

```
🤖 487 / 500 credits remaining
████████████████████░░ 
```

- Small, always visible in header or footer area
- Progress bar showing usage
- Changes color when low (<10%): yellow, then red (<5%)

---

## 5. Tab-by-Tab Layout Specs

### Tab 1: Audit

```
┌─────────────────────────────────────┐
│ 🔍 SEO Power Tool          [⚙️]    │
├─────────────────────────────────────┤
│ [Audit] [Content] [Meta]           │
│ [Schema] [Links] [Dashboard]       │
├─────────────────────────────────────┤
│                                     │
│  [🔍 Audit This Page]              │
│  [🔍 Audit Entire Site]            │
│                                     │
│ ─── After audit runs: ───           │
│                                     │
│   ┌────────┐  ┌────────┐           │
│   │  72    │  │  48    │           │
│   │  SEO   │  │  GEO   │           │
│   └────────┘  └────────┘           │
│                                     │
│ Issues (14)  [🤖 AI Fix All]       │
│                                     │
│ 🔴 Critical (3)                    │
│ ├─ Missing H1 tag          [Fix]   │
│ ├─ 8 images missing alt   [🤖 Fix] │
│ └─ No schema markup        [🤖 Fix] │
│                                     │
│ 🟡 Warning (7)                     │
│ ├─ Meta desc too short (12) [🤖]   │
│ ├─ 3 orphan pages          [View]  │
│ └─ ... (show more)                  │
│                                     │
│ 🔵 Info (4)                        │
│ └─ ... collapsed by default         │
│                                     │
│ 🤖 487/500 credits                 │
└─────────────────────────────────────┘
```

### Tab 2: Content Score

```
┌─────────────────────────────────────┐
│ [Audit] [Content•] [Meta]          │
│ [Schema] [Links] [Dashboard]       │
├─────────────────────────────────────┤
│                                     │
│ Page: [▼ Select CMS item      ]    │
│ Keyword: [ best pm tools       ]   │
│                                     │
│ [🤖 Analyze Content]               │
│                                     │
│ ─── Results: ───                    │
│                                     │
│ Content Score: 62/100 (B-)         │
│ ████████████░░░░░░░░               │
│                                     │
│ Topics    65% ████▓░░               │
│ Words     800/2100 ███░░░           │
│ Density   0.3%/1.5% █░░░░          │
│                                     │
│ Missing Topics:                     │
│ [Gantt] [Agile] [Kanban] [Sprint]  │
│ [Roadmap] [Collaboration] [+8]     │
│                                     │
│ Recommendations:                    │
│ 🔴 Add Gantt charts section        │
│ 🔴 Cover Agile methodology         │
│ 🟡 Expand to 1,800+ words          │
│ 🟡 Add comparison table            │
│                                     │
│ E-E-A-T Score: 54/100              │
│ ████████░░░░░░░░░░░░               │
│ Experience ███░░  Expertise ████░   │
│ Authority  ██░░░  Trust     █████   │
└─────────────────────────────────────┘
```

### Tab 3: Meta Editor

```
┌─────────────────────────────────────┐
│ [Audit] [Content] [Meta•]          │
│ [Schema] [Links] [Dashboard]       │
├─────────────────────────────────────┤
│                                     │
│ Collection: [▼ Blog Posts    ]     │
│                                     │
│ [🤖 Bulk AI Generate]  [Bulk Edit] │
│                                     │
│ ┌─ /blog/pm-tools ──────── 78 ──┐ │
│ │ Title: Best PM Tools 2026      │ │
│ │        48/60 ✅                 │ │
│ │ Desc:  Discover the top...     │ │
│ │        142/160 ✅    [🤖 Gen]  │ │
│ └────────────────────────────────┘ │
│                                     │
│ ┌─ /blog/seo-guide ──────── 12 ─┐ │
│ │ Title: ❌ Missing               │ │
│ │ Desc:  ❌ Missing    [🤖 Gen]  │ │
│ └────────────────────────────────┘ │
│                                     │
│ ┌─ /blog/startup-tips ───── 92 ─┐ │
│ │ Title: How to Launch... ✅     │ │
│ │ Desc:  Complete guide to... ✅ │ │
│ └────────────────────────────────┘ │
│                                     │
│ 30 items • 18 need attention       │
└─────────────────────────────────────┘
```

### Tab 4: Schema

```
┌─────────────────────────────────────┐
│ [Audit] [Content] [Meta]           │
│ [Schema•] [Links] [Dashboard]      │
├─────────────────────────────────────┤
│                                     │
│ Page: [▼ Current Page        ]     │
│                                     │
│ [🤖 AI Detect Schema Type]         │
│                                     │
│ Detected: Article ✅                │
│                                     │
│ ┌─ Properties ──────────────────┐  │
│ │ headline:    "Best PM Tools"  │  │
│ │ datePublished: 2026-03-15     │  │
│ │ author:      "Edo Williams"   │  │
│ │ image:       featured.jpg     │  │
│ │ description: "Discover..."    │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ JSON-LD Preview ─────────────┐  │
│ │ {                              │  │
│ │   "@context": "schema.org",   │  │
│ │   "@type": "Article",         │  │
│ │   "headline": "Best PM..."    │  │
│ │ }                              │  │
│ └───────────────────────────────┘  │
│                                     │
│ Validation: ✅ Valid                │
│                                     │
│ [Generate & Inject]                 │
└─────────────────────────────────────┘
```

### Tab 5: Links

```
┌─────────────────────────────────────┐
│ [Audit] [Content] [Meta]           │
│ [Schema] [Links•] [Dashboard]      │
├─────────────────────────────────────┤
│                                     │
│ Internal Link Analysis    45 pages  │
│ [🤖 AI Suggest Links]              │
│                                     │
│ 🔴 Orphan Pages (3)                │
│ ├─ /blog/old-post    0↓ 2↑  [→]   │
│ ├─ /privacy           0↓ 0↑  [→]   │
│ └─ /case-study-acme   0↓ 1↑  [→]   │
│                                     │
│ 🟡 Underlinked (5)                 │
│ ├─ /pricing           1↓ 3↑  [→]   │
│ └─ /blog/seo-guide    1↓ 4↑  [→]   │
│                                     │
│ ─── AI Suggestions (47) ───        │
│                                     │
│ 📎 "project management" on /blog   │
│    → link to /tools (95% match)    │
│    [Add Link]                       │
│                                     │
│ 📎 "our methodology" on /about     │
│    → link to /blog/agile (88%)     │
│    [Add Link]                       │
│                                     │
│ [Add All High-Confidence (12)]     │
└─────────────────────────────────────┘
```

### Tab 6: Dashboard

```
┌─────────────────────────────────────┐
│ [Audit] [Content] [Meta]           │
│ [Schema] [Links] [Dashboard•]      │
├─────────────────────────────────────┤
│                                     │
│  ┌────────┐  ┌────────┐            │
│  │  72    │  │  48    │            │
│  │  SEO   │  │  GEO   │            │
│  └────────┘  └────────┘            │
│                                     │
│ Score History (30 days)             │
│ ┌───────────────────────────────┐  │
│ │ 80─              ╱──── SEO   │  │
│ │ 60─       ╱─────╱            │  │
│ │ 40─ ─────╱  ╱─── GEO        │  │
│ │ 20─────────╱                 │  │
│ │    Mar 1    Mar 15    Mar 30 │  │
│ └───────────────────────────────┘  │
│                                     │
│ Issues: 3🔴  7🟡  4🔵  = 14 total │
│                                     │
│ Pages by Score:                     │
│ /features       92  ████████████   │
│ /about          78  █████████░░░   │
│ /pricing        68  ████████░░░░   │
│ /blog/post-1    34  ████░░░░░░░░   │
│                                     │
│ [🤖 Fix Highest Impact]            │
│                                     │
│ 🤖 Credits: 487/500 this month    │
└─────────────────────────────────────┘
```

---

## 6. Animations & Micro-interactions

| Interaction | Animation | Duration |
|------------|-----------|----------|
| Score appears after audit | Count-up from 0, ring fills clockwise | 1.5s ease-out |
| Issue fixed | Card border transitions to green, ✅ appears, card collapses smoothly | 0.5s |
| Score updates after fix | Number ticks up with slight bounce | 0.8s |
| AI generating | Purple shimmer/pulse on the button, small spinner | Until complete |
| AI result appears | Slide-in from right with fade | 0.3s |
| Tab switch | Crossfade content | 0.15s |
| Hover on issue card | Background lifts slightly, subtle shadow | 0.1s |
| Topic chip hover | Slight scale up (1.02x) | 0.1s |
| Credit deduction | Number ticks down, brief yellow flash if low | 0.3s |

**Key principle:** Animations are fast and functional. Nothing decorative. They communicate state changes.

---

## 7. Recommended Template & Component Stack

### Primary UI Library: Tremor (tremor.so)

**Tremor is our primary component library.** It provides production-ready React dashboard components with Tailwind CSS styling. Dark mode built-in.

| Tremor Component | Where We Use It |
|-----------------|----------------|
| **DonutChart** | Score rings (SEO + GEO dual display) |
| **AreaChart** | Dashboard score history trend line |
| **BarList** | Pages ranked by score |
| **ProgressBar** | Topic coverage, keyword density, audit progress |
| **Badge / BadgeDelta** | Issue severity indicators, score change deltas |
| **Table** | Meta editor data table, link analysis table |
| **Card** | Issue cards, stat cards, metric panels |
| **NumberTicker** (custom) | Score count-up animation |
| **Tracker** | E-E-A-T dimension bars, credit usage |
| **SparkChart** | Mini score trends in page list |
| **Callout** | Recommendations, tips |
| **Tab / TabGroup** | Main 6-tab navigation |

**Install:** `npm install @tremor/react recharts tailwindcss @tailwindcss/vite`

### Additional Resources

| Resource | URL | What to Take |
|----------|-----|-------------|
| **Lucide Icons** | <https://lucide.dev> | Clean, consistent icon set. Matches the Linear/Vercel aesthetic. Tree-shakeable — only import what we use. |
| **Magic UI** | <https://magicui.design> | Animated number component (for score count-up). Shimmer effect (for AI loading states). |

### Premium / Paid (CONSIDER BUYING)

| Resource | URL | Price | What to Take |
|----------|-----|-------|-------------|
| **Tailwind Plus** (formerly TailwindUI) | <https://tailwindcss.com/plus> | $299 one-time | Dark mode application shell layouts, data table patterns, stat cards, stacked lists. Extract the patterns and convert to CSS Modules. |
| **Cruip Mosaic** | <https://cruip.com> (Mosaic template) | ~$79 (bundle) | Dark analytics dashboard template. Score cards, chart layouts, table designs. Study the layout patterns for our Dashboard tab. |
| **Magic UI Pro** | <https://pro.magicui.design> | $49-99 | Premium landing page sections (for marketing site later), plus polished animated components. |

### Decision: What to Actually Buy

**Minimum (free):** shadcn/ui + Tremor + Lucide Icons + Recharts. This gives us everything we need.

**Recommended ($299):** Add Tailwind Plus for the polished dark-mode data table and stat card patterns. Worth it — we'll use these patterns across multiple products.

---

## 8. Implementation Notes for Codex/Claude Code

### No Tailwind in the Plugin
The Framer plugin is a small React app in an iframe. We use **CSS Modules** (`.module.css` files), not Tailwind. This keeps the bundle tiny.

However, we **study** Tailwind Plus and shadcn patterns and recreate them in CSS Modules. The visual result is the same, the implementation is lighter.

### SVG Score Rings
Build custom SVG progress rings. Don't import a library for this:

```tsx
function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={styles.scoreRing}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className={styles.scoreNumber}>{score}</div>
      <div className={styles.scoreLabel}>{label}</div>
    </div>
  )
}
```

### Framer UI Matching
Framer's editor uses:
- Font: Inter / system font stack
- Corner radius: 8px for cards, 6px for buttons, 4px for inputs
- Spacing scale: 4px / 8px / 12px / 16px / 24px
- Transition timing: 150ms for hovers, 300ms for state changes
- No shadows in dark mode — use border separation instead

---

## Sources

- linear.app — Panel design, list aesthetics
- raycast.com — Floating panel UI patterns
- vercel.com/dashboard — Dark mode analytics
- ui.shadcn.com — Component patterns
- tremor.so — Chart and dashboard components
- magicui.design — Animated components
- tailwindcss.com/plus — Premium dark mode patterns
- cruip.com — Dashboard templates
- recharts.org — Lightweight React charts
- lucide.dev — Icon set
- framer.com/developers — Plugin SDK constraints
