import { useCallback } from 'react'
import { useDesignStore } from '@/store/designStore'
import { useHistoryStore } from '@/store/historyStore'
import { useUIStore } from '@/store/uiStore'
import { parseDesignFile } from '@/utils/schemaValidator'

export function useDesignIO() {
  const saveDesign = useCallback(() => {
    const file = useDesignStore.getState().toDesignFile()
    const json = JSON.stringify(file, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${file.metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)

    useUIStore.getState().setStatusMessage('Design saved')
    setTimeout(() => useUIStore.getState().setStatusMessage(''), 3000)
  }, [])

  const loadDesign = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const { file: designFile, errors } = parseDesignFile(text)

      if (!designFile) {
        useUIStore.getState().setStatusMessage(`Load failed: ${errors[0]}`)
        setTimeout(() => useUIStore.getState().setStatusMessage(''), 5000)
        return
      }

      useHistoryStore.getState().clear()
      useDesignStore.getState().loadDesign(designFile)
      useUIStore.getState().setStatusMessage(`Loaded: ${designFile.metadata.name}`)
      setTimeout(() => useUIStore.getState().setStatusMessage(''), 3000)
    }
    reader.readAsText(file)
  }, [])

  return { saveDesign, loadDesign }
}
