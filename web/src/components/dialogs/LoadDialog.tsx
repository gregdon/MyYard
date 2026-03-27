import { useRef } from 'react'
import { toast } from 'sonner'
import { useTabStore } from '@/store/tabStore'
import { parseDesignFile } from '@/utils/schemaValidator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoadDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const openDesignTab = useTabStore((s) => s.openDesignTab)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const { file: designFile, errors } = parseDesignFile(text)

      if (!designFile) {
        toast.error(`Failed to load project: ${errors[0]}`)
        return
      }

      console.warn('[LoadDialog] parsed file:', designFile.metadata.name)

      // Close dialog
      onOpenChange(false)

      // Create tab with loaded design
      const tabsBefore = useTabStore.getState().tabs.length
      openDesignTab(designFile)
      const tabsAfter = useTabStore.getState().tabs.length
      console.warn(`[LoadDialog] tabs: ${tabsBefore} -> ${tabsAfter}`)

      toast.success(`Loaded: ${designFile.metadata.name}`)
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Open Project</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select a .json project file to open
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button onClick={() => fileRef.current?.click()}>
            Choose File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
