import { useUIStore } from '@/store/uiStore'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RightDrawerProps {
  children: React.ReactNode
}

export function RightDrawer({ children }: RightDrawerProps) {
  const activeRightDrawer = useUIStore((s) => s.activeRightDrawer)
  const setActiveRightDrawer = useUIStore((s) => s.setActiveRightDrawer)

  return (
    <div
      className={`
        absolute right-0 top-0 bottom-0 z-30 w-80 border-l bg-background
        transition-transform duration-200 ease-in-out
        ${activeRightDrawer ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="flex h-10 items-center justify-between border-b px-3">
        <span className="text-sm font-medium capitalize">
          {activeRightDrawer === 'ai' ? 'AI Assistant' : activeRightDrawer ?? ''}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setActiveRightDrawer(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
