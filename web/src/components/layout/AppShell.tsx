import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { useTabStore } from '@/store/tabStore'
import { AppHeader } from './AppHeader'
import { AppFooter } from './AppFooter'
import { RightDrawer } from './RightDrawer'
import { HelpDrawer } from '@/components/drawers/HelpDrawer'
import { AIAssistantDrawer } from '@/components/drawers/AIAssistantDrawer'

export function AppShell() {
  const activeRightDrawer = useUIStore((s) => s.activeRightDrawer)

  // Warn before closing browser if any tabs have unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasDirty = useTabStore.getState().tabs.some(t => t.isDirty)
      if (hasDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Outlet />
        <RightDrawer>
          {activeRightDrawer === 'help' && <HelpDrawer />}
          {activeRightDrawer === 'ai' && <AIAssistantDrawer />}
        </RightDrawer>
      </div>
      <AppFooter />
    </div>
  )
}
