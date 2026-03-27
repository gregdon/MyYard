import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FilePlus, ChevronDown, Clipboard, Copy, Scissors, Trash2, BoxSelect } from 'lucide-react'

interface RibbonHomeTabProps {
  onNewDesign: () => void
  onNewTemplate: () => void
}

export function RibbonHomeTab({ onNewDesign, onNewTemplate }: RibbonHomeTabProps) {
  return (
    <>
      {/* New dropdown */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                <FilePlus className="h-4 w-4" />
                New
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>New Project or Template</TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onNewDesign}>
            <FilePlus className="mr-2 h-4 w-4" />
            Project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onNewTemplate}>
            <FilePlus className="mr-2 h-4 w-4" />
            Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5" />

      {/* Clipboard actions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
            <Scissors className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Cut (Ctrl+X)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy (Ctrl+C)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
            <Clipboard className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Paste (Ctrl+V)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
            <BoxSelect className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Select All (Ctrl+A)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </>
  )
}
