import { useUIStore } from '@/store/uiStore'
import {
  ArrowLeft,
  FilePlus2,
  FolderOpen,
  Save,
  SaveAll,
  Image,
  FileText,
  Settings,
} from 'lucide-react'

interface FileBackstageProps {
  onNew: () => void
  onSave: () => void
  onLoad: () => void
}

export function FileBackstage({ onNew, onSave, onLoad }: FileBackstageProps) {
  const setFileBackstageOpen = useUIStore((s) => s.setFileBackstageOpen)

  const close = () => setFileBackstageOpen(false)

  const items = [
    { label: 'New Design', icon: FilePlus2, action: () => { onNew(); close() } },
    { label: 'Open', icon: FolderOpen, action: () => { onLoad(); close() } },
    { label: 'Save', icon: Save, action: () => { onSave(); close() }, shortcut: 'Ctrl+S' },
    { label: 'Save As', icon: SaveAll, action: undefined },
    { label: 'Export PNG', icon: Image, action: undefined },
    { label: 'Export PDF', icon: FileText, action: undefined },
  ]

  return (
    <div className="fixed inset-0 z-50 flex bg-background/95 backdrop-blur-sm">
      {/* Left sidebar */}
      <div className="flex w-72 flex-col border-r bg-primary/5">
        <button
          onClick={close}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Editor
        </button>

        <div className="flex-1 px-2 py-2">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              disabled={!item.action}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-muted-foreground">{item.shortcut}</span>
              )}
            </button>
          ))}

          <div className="my-3 border-t" />

          <button
            disabled
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-semibold mb-6">Recent Designs</h2>
        <p className="text-muted-foreground">No recent designs yet. Create a new design to get started.</p>
      </div>
    </div>
  )
}
