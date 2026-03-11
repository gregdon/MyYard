import { useUIStore } from '@/store/uiStore'
import { UserMenu } from '@/components/auth/UserMenu'
import { RibbonHome } from './RibbonHome'
import { RibbonDesign } from './RibbonDesign'
import { RibbonInsert } from './RibbonInsert'
import { RibbonView } from './RibbonView'
import { FileBackstage } from './FileBackstage'
import { cn } from '@/lib/utils'
import { TreePine } from 'lucide-react'
import type { RibbonTab } from '@/types/ribbon'

const tabs: { id: RibbonTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'design', label: 'Design' },
  { id: 'insert', label: 'Insert' },
  { id: 'view', label: 'View' },
]

interface RibbonProps {
  onNew: () => void
  onSave: () => void
  onLoad: () => void
}

export function Ribbon({ onNew, onSave, onLoad }: RibbonProps) {
  const activeTab = useUIStore((s) => s.activeRibbonTab)
  const setActiveTab = useUIStore((s) => s.setActiveRibbonTab)
  const fileBackstageOpen = useUIStore((s) => s.fileBackstageOpen)
  const setFileBackstageOpen = useUIStore((s) => s.setFileBackstageOpen)

  return (
    <>
      <div className="flex flex-col border-b bg-background">
        {/* Tab strip */}
        <div className="flex h-9 items-center border-b px-1">
          {/* Logo */}
          <div className="flex items-center gap-1.5 px-2 mr-1">
            <TreePine className="h-5 w-5 text-primary" />
          </div>

          {/* File button */}
          <button
            onClick={() => setFileBackstageOpen(true)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              'hover:bg-primary/10 text-primary'
            )}
          >
            File
          </button>

          {/* Tab buttons */}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-md px-3 py-1 text-sm transition-colors',
                activeTab === tab.id
                  ? 'font-medium text-primary border-b-2 border-primary rounded-b-none'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {tab.label}
            </button>
          ))}

          {/* Right side: user menu */}
          <div className="ml-auto flex items-center pr-2">
            <UserMenu />
          </div>
        </div>

        {/* Ribbon panel — content for active tab */}
        <div className="min-h-[60px] overflow-x-auto">
          {activeTab === 'home' && <RibbonHome onNew={onNew} onSave={onSave} onLoad={onLoad} />}
          {activeTab === 'design' && <RibbonDesign />}
          {activeTab === 'insert' && <RibbonInsert />}
          {activeTab === 'view' && <RibbonView />}
        </div>
      </div>

      {/* File backstage overlay */}
      {fileBackstageOpen && (
        <FileBackstage onNew={onNew} onSave={onSave} onLoad={onLoad} />
      )}
    </>
  )
}
