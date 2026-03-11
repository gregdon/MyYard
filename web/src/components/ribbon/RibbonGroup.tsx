import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'

interface RibbonGroupProps {
  label: string
  children: ReactNode
  hideSeparator?: boolean
}

export function RibbonGroup({ label, children, hideSeparator }: RibbonGroupProps) {
  return (
    <div className="flex items-stretch gap-0">
      <div className="flex flex-col items-center justify-between px-2 py-1">
        <div className="flex flex-1 items-center gap-1">
          {children}
        </div>
        <span className="text-[10px] text-muted-foreground leading-none pb-0.5">
          {label}
        </span>
      </div>
      {!hideSeparator && <Separator orientation="vertical" className="h-auto" />}
    </div>
  )
}
