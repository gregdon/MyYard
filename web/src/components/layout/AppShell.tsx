import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { AppHeader } from './AppHeader'
import { AppFooter } from './AppFooter'
import { RightDrawer } from './RightDrawer'
import { HelpDrawer } from '@/components/drawers/HelpDrawer'
import { AIAssistantDrawer } from '@/components/drawers/AIAssistantDrawer'

export function AppShell() {
  const activeRightDrawer = useUIStore((s) => s.activeRightDrawer)

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <div className="relative flex flex-1 overflow-hidden">
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
