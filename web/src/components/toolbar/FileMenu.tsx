import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { File, FolderOpen, Save, FilePlus } from 'lucide-react'

interface FileMenuProps {
  onNew: () => void
  onSave: () => void
  onLoad: () => void
}

export function FileMenu({ onNew, onSave, onLoad }: FileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <File className="h-3.5 w-3.5" />
          File
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onNew}>
          <FilePlus className="mr-2 h-4 w-4" />
          New Project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          Save (Ctrl+S)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLoad}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Load
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
