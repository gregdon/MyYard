import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FolderOpen, Save, SaveAll } from 'lucide-react'

interface RibbonFileTabProps {
  onSave: () => void
  onSaveAs: () => void
  onLoad: () => void
}

export function RibbonFileTab({ onSave, onSaveAs, onLoad }: RibbonFileTabProps) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSave}>
            <Save className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save (Ctrl+S)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSaveAs}>
            <SaveAll className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save As (Ctrl+Shift+S)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onLoad}>
            <FolderOpen className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open</TooltipContent>
      </Tooltip>
    </>
  )
}
