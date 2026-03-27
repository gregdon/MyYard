import { useCallback } from 'react'
import { toast } from 'sonner'
import { useDesignStore } from '@/store/designStore'
import { useUIStore } from '@/store/uiStore'
import { useTabStore } from '@/store/tabStore'
import { parseDesignFile } from '@/utils/schemaValidator'
import type { DesignFile } from '@/types'

export function useDesignIO() {
  /** Download the design file to disk */
  const downloadDesign = useCallback((fileName?: string) => {
    const file = useDesignStore.getState().toDesignFile()

    // If a new name was provided, update metadata
    if (fileName) {
      useDesignStore.getState().setMetadata({ name: fileName })
      file.metadata.name = fileName
    }

    const json = JSON.stringify(file, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${file.metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)

    useUIStore.getState().setHasBeenSaved(true)
    toast.success('Project saved')
  }, [])

  /** Save — if never saved before, returns false so caller can show dialog */
  const saveDesign = useCallback((): boolean => {
    const hasBeenSaved = useUIStore.getState().hasBeenSaved
    if (!hasBeenSaved) {
      return false // caller should open SaveDialog
    }
    downloadDesign()
    return true
  }, [downloadDesign])

  /** Save As — caller provides the name from dialog */
  const saveAsDesign = useCallback((fileName: string) => {
    downloadDesign(fileName)
  }, [downloadDesign])

  /** Parse a design file and open it in a new tab */
  const loadDesign = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const { file: designFile, errors } = parseDesignFile(text)

      if (!designFile) {
        toast.error(`Failed to load design: ${errors[0]}`)
        return
      }

      openDesignFile(designFile)
    }
    reader.readAsText(file)
  }, [])

  /** Open a parsed DesignFile in a new tab */
  const openDesignFile = useCallback((designFile: DesignFile) => {
    const before = useTabStore.getState().tabs.length
    useTabStore.getState().openDesignTab(designFile)
    const after = useTabStore.getState().tabs.length
    console.warn(`[useDesignIO] openDesignFile tabs: ${before} -> ${after}, activeTabId: ${useTabStore.getState().activeTabId}`)
    toast.success(`Loaded: ${designFile.metadata.name}`)
  }, [])

  return { saveDesign, saveAsDesign, downloadDesign, loadDesign, openDesignFile }
}
