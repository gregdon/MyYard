import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Menu } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useTabStore } from '@/store/tabStore'
import { RibbonFileTab } from './RibbonFileTab'
import { RibbonHomeTab } from './RibbonHomeTab'
import { RibbonViewTab } from './RibbonViewTab'
import { RibbonDesignTab } from './RibbonDesignTab'
import { RibbonTemplateTab } from './RibbonTemplateTab'

// ── Types ───────────────────────────────────────────────────────────

type RibbonTabId = 'file' | 'home' | 'view' | 'design' | 'template'

interface MenuTabDef {
  id: RibbonTabId
  label: string
  contextual?: boolean
}

// ── Props ───────────────────────────────────────────────────────────

interface RibbonBarProps {
  onSave: () => void
  onSaveAs: () => void
  onExport: () => void
  onImport: () => void
  onNewDesign: () => void
  onNewTemplate: () => void
  onSaveTemplate?: () => void
  onTemplateCancel: () => void
  onTemplateSave: () => void
  onTemplateSaveAndClose: () => void
}

// ── Component ───────────────────────────────────────────────────────

export function RibbonBar({
  onSave,
  onSaveAs,
  onExport,
  onImport,
  onNewDesign,
  onNewTemplate,
  onSaveTemplate,
  onTemplateCancel,
  onTemplateSave,
  onTemplateSaveAndClose,
}: RibbonBarProps) {
  const activeRibbonTab = useUIStore((s) => s.activeRibbonTab) as RibbonTabId
  const setActiveRibbonTab = useUIStore((s) => s.setActiveRibbonTab)
  const toggleSideNav = useUIStore((s) => s.toggleSideNav)
  const activeTab = useTabStore((s) => s.getActiveTab())

  const isDesignTab = activeTab?.type === 'design'
  const isTemplateTab = activeTab?.type === 'template-edit'

  // Auto-switch to contextual tab when document tab changes
  useEffect(() => {
    if (isDesignTab) {
      setActiveRibbonTab('design')
    } else if (isTemplateTab) {
      setActiveRibbonTab('template')
    } else {
      // On Start tab or no tab, default to home
      if (activeRibbonTab === 'design' || activeRibbonTab === 'template') {
        setActiveRibbonTab('home')
      }
    }
  }, [activeTab?.id, activeTab?.type]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build menu tabs list
  const menuTabs: MenuTabDef[] = [
    { id: 'file', label: 'File' },
    { id: 'home', label: 'Home' },
    { id: 'view', label: 'View' },
  ]
  if (isDesignTab) {
    menuTabs.push({ id: 'design', label: 'Design', contextual: true })
  }
  if (isTemplateTab) {
    menuTabs.push({ id: 'template', label: 'Template', contextual: true })
  }

  return (
    <div className="border-b bg-card">
      {/* Row 1: Menu tab labels */}
      <div className="flex h-7 items-stretch border-b px-1">
        {menuTabs.map(tab => (
          <button
            key={tab.id}
            className={`px-3 text-xs font-medium transition-colors ${
              activeRibbonTab === tab.id
                ? tab.contextual
                  ? 'border-b-2 border-b-primary text-primary'
                  : 'border-b-2 border-b-foreground text-foreground'
                : tab.contextual
                  ? 'text-primary/70 hover:text-primary'
                  : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveRibbonTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Row 2: Command buttons */}
      <div className="flex h-9 items-center gap-1 px-2">
        {/* Persistent hamburger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleSideNav}>
              <Menu className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Sidebar</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-5" />

        {/* Tab-specific commands */}
        {activeRibbonTab === 'file' && (
          <RibbonFileTab onSave={onSave} onSaveAs={onSaveAs} onExport={onExport} onImport={onImport} />
        )}
        {activeRibbonTab === 'home' && (
          <RibbonHomeTab onNewDesign={onNewDesign} onNewTemplate={onNewTemplate} />
        )}
        {activeRibbonTab === 'view' && <RibbonViewTab />}
        {activeRibbonTab === 'design' && (
          <RibbonDesignTab onSave={onSave} onSaveTemplate={onSaveTemplate} />
        )}
        {activeRibbonTab === 'template' && (
          <RibbonTemplateTab
            onCancel={onTemplateCancel}
            onSave={onTemplateSave}
            onSaveAndClose={onTemplateSaveAndClose}
          />
        )}
      </div>
    </div>
  )
}
