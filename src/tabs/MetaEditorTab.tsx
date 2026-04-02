import { useMemo, useState } from "react"
import {
  Badge,
  Card,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextInput,
  Textarea,
} from "@tremor/react"
import { AIButton } from "../components/AIButton"
import { SerpPreview } from "../components/SerpPreview"
import { useAICredits } from "../hooks/useAICredits"

type MetaRow = {
  path: string
  title: string
  description: string
  score: number
}

const initialRows: MetaRow[] = [
  {
    path: "/blog/pm-tools",
    title: "Best Project Management Tools 2026",
    description: "Discover the top project management tools for teams. Compare features, pricing, and find the perfect platform for 2026.",
    score: 78,
  },
  { path: "/blog/seo-guide", title: "", description: "", score: 12 },
  {
    path: "/blog/startup-tips",
    title: "How to Launch a Startup in Framer",
    description: "A complete guide to validating, launching, and scaling a startup site built in Framer.",
    score: 92,
  },
]

function metaTone(score: number) {
  if (score >= 80) return "green"
  if (score >= 50) return "yellow"
  return "red"
}

export function MetaEditorTab() {
  const [collection, setCollection] = useState("blog-posts")
  const [rows, setRows] = useState(initialRows)
  const [expandedPath, setExpandedPath] = useState(initialRows[0].path)
  const { refresh } = useAICredits("pro")

  const expandedRow = useMemo(
    () => rows.find((row) => row.path === expandedPath) ?? rows[0],
    [expandedPath, rows]
  )

  const updateRow = (path: string, field: "title" | "description", value: string) => {
    setRows((current) =>
      current.map((row) =>
        row.path === path
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    )
  }

  const generateMeta = async (path: string) => {
    setRows((current) =>
      current.map((row) =>
        row.path === path
          ? {
              ...row,
              title: row.title || "AI Generated SEO Title for Framer Growth",
              description:
                row.description ||
                "AI generated description that adds context, intent, and a better click-through hook for this page.",
              score: Math.max(row.score, 84),
            }
          : row
      )
    )
    await refresh()
  }

  return (
    <div className="space-y-4">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Collection</div>
            <Select value={collection} onValueChange={setCollection}>
              <SelectItem value="blog-posts">Blog Posts</SelectItem>
              <SelectItem value="landing-pages">Landing Pages</SelectItem>
            </Select>
          </div>
          <AIButton variant="solid" onClick={() => void Promise.all(rows.map((row) => generateMeta(row.path)))}>
            Bulk AI Generate
          </AIButton>
        </div>
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Page</TableHeaderCell>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Desc</TableHeaderCell>
              <TableHeaderCell>Score</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row.path}
                className={`${index % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"} cursor-pointer`}
                onClick={() => setExpandedPath(row.path)}
              >
                <TableCell className="text-zinc-300">{row.path}</TableCell>
                <TableCell>{row.title ? `✅ ${row.title.length}ch` : "❌ Missing"}</TableCell>
                <TableCell>{row.description ? `✅ ${row.description.length}ch` : "❌ Missing"}</TableCell>
                <TableCell>
                  <Badge color={metaTone(row.score)}>{row.score}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {expandedRow ? (
        <Card className="border-white/6 bg-[var(--bg-secondary)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">{expandedRow.path}</div>
              <div className="text-xs text-zinc-500">Inline meta editor</div>
            </div>
            <AIButton variant="ghost" onClick={() => void generateMeta(expandedRow.path)}>
              Generate
            </AIButton>
          </div>
          <div className="space-y-3">
            <TextInput
              value={expandedRow.title}
              placeholder="Meta title"
              onValueChange={(value) => updateRow(expandedRow.path, "title", value)}
            />
            <Textarea
              value={expandedRow.description}
              placeholder="Meta description"
              onValueChange={(value) => updateRow(expandedRow.path, "description", value)}
            />
            <SerpPreview
              title={expandedRow.title}
              url={`https://rankframe.site${expandedRow.path}`}
              description={expandedRow.description}
            />
          </div>
        </Card>
      ) : null}
    </div>
  )
}
