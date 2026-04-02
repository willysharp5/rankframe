import { useState } from "react"
import { framer } from "framer-plugin"
import { Card, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react"
import {
  BarChart3,
  FileCode2,
  FileSearch,
  LayoutDashboard,
  Link2,
  PenSquare,
  Search,
} from "lucide-react"
import "./App.css"
import { CreditsBadge } from "./components/CreditsBadge"
import { useAICredits } from "./hooks/useAICredits"
import { AuditTab } from "./tabs/AuditTab"
import { ContentScoreTab } from "./tabs/ContentScoreTab"
import { DashboardTab } from "./tabs/DashboardTab"
import { LinksTab } from "./tabs/LinksTab"
import { MetaEditorTab } from "./tabs/MetaEditorTab"
import { SchemaTab } from "./tabs/SchemaTab"

framer.showUI({
  position: "top right",
  width: 380,
  height: 600,
})

const tabs = [
  { label: "Audit", icon: Search, panel: <AuditTab /> },
  { label: "Content", icon: BarChart3, panel: <ContentScoreTab /> },
  { label: "Meta", icon: PenSquare, panel: <MetaEditorTab /> },
  { label: "Schema", icon: FileCode2, panel: <SchemaTab /> },
  { label: "Links", icon: Link2, panel: <LinksTab /> },
  { label: "Dashboard", icon: LayoutDashboard, panel: <DashboardTab /> },
]

export function App() {
  const [activeTab, setActiveTab] = useState(0)
  const { credits, total } = useAICredits("pro")

  return (
    <main className="rankframe-shell rankframe-panel overflow-hidden text-white">
      <div className="flex h-full flex-col">
        <header className="border-b border-white/6 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                <FileSearch className="h-3.5 w-3.5 text-blue-400" />
                RankFrame
              </div>
              <h1 className="mt-2 text-base font-semibold">AI-Powered SEO for Framer</h1>
            </div>
            <CreditsBadge remaining={credits.remaining} total={total} />
          </div>
        </header>

        <TabGroup index={activeTab} onIndexChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-white/6 px-4 py-3">
            <TabList
              variant="solid"
              color="gray"
              className="grid grid-cols-3 gap-2 bg-transparent [&>button]:justify-center [&>button]:rounded-xl [&>button]:border [&>button]:border-white/6 [&>button]:bg-transparent [&>button]:px-2 [&>button]:py-2 [&>button]:text-xs [&>button]:text-zinc-400 [&>button[data-state=active]]:bg-[var(--bg-tertiary)] [&>button[data-state=active]]:text-white"
            >
              {tabs.map((tab) => (
                <Tab key={tab.label} icon={tab.icon}>
                  {tab.label}
                </Tab>
              ))}
            </TabList>
          </div>

          <TabPanels className="min-h-0 flex-1">
            {tabs.map((tab) => (
              <TabPanel key={tab.label} className="fade-in h-full">
                <section className="rankframe-scroll h-full overflow-y-auto px-4 py-4">
                  <Card className="min-h-full border-white/0 bg-transparent p-0 shadow-none">
                    {tab.panel}
                  </Card>
                </section>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </main>
  )
}
