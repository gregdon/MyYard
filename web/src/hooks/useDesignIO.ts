import { useCallback } from 'react'
import { toast } from 'sonner'
import { useDesignStore } from '@/store/designStore'
import { useTabStore } from '@/store/tabStore'
import { useDesignCloudStore } from '@/store/designCloudStore'
import { useAuthStore } from '@/store/authStore'
import { parseDesignFile } from '@/utils/schemaValidator'
import type { DesignFile } from '@/types/schema'
import type { DesignVersionData } from '@/types/cloudDesign'

/** Extract version data from the live design stores */
function getVersionData(): DesignVersionData {
  const file = useDesignStore.getState().toDesignFile()
  return {
    grid: file.grid,
    heightOverrides: file.heightOverrides,
    placedObjects: file.placedObjects,
  }
}

export function useDesignIO() {
  // ── Cloud Save ───────────────────────────────────────────────────

  /** Save to cloud. Returns 'saved' | 'needs-name' | 'no-auth' */
  const saveToCloud = useCallback(async (name?: string, description?: string): Promise<'saved' | 'needs-name' | 'no-auth'> => {
    const user = useAuthStore.getState().user
    if (!user) {
      toast.error('Sign in to save designs')
      return 'no-auth'
    }

    const tab = useTabStore.getState().getActiveTab()
    if (!tab || tab.type !== 'design') return 'no-auth'

    const ds = useDesignStore.getState()
    const gridSettings = ds.gridSettings
    const versionData = getVersionData()

    if (tab.cloudDesignId) {
      // Update existing
      const designName = name ?? ds.metadata.name
      await useDesignCloudStore.getState().saveDesign(
        tab.cloudDesignId,
        designName,
        description ?? '',
        gridSettings,
        versionData,
      )
      if (name) {
        ds.setMetadata({ name: designName })
        useTabStore.getState().setTabTitle(tab.id, designName)
      }
      useTabStore.getState().markActiveSaved()
      toast.success('Design saved')
      return 'saved'
    }

    // First save — need a name
    if (!name) return 'needs-name'

    const meta = await useDesignCloudStore.getState().createDesign(
      user.id,
      name,
      description ?? '',
      gridSettings,
      versionData,
    )
    useTabStore.getState().setTabCloudDesignId(tab.id, meta.id)
    ds.setMetadata({ name })
    useTabStore.getState().setTabTitle(tab.id, name)
    useTabStore.getState().markActiveSaved()
    toast.success('Design saved')
    return 'saved'
  }, [])

  /** Ctrl+S handler — returns false if dialog needed */
  const saveDesign = useCallback(async (): Promise<boolean> => {
    const tab = useTabStore.getState().getActiveTab()
    if (!tab || tab.type !== 'design') return false

    const result = await saveToCloud()
    return result === 'saved'
  }, [saveToCloud])

  // ── Cloud Load ───────────────────────────────────────────────────

  /** Open a cloud design in a new tab */
  const openCloudDesign = useCallback(async (designId: string) => {
    const designData = await useDesignCloudStore.getState().openDesign(designId)
    if (!designData) {
      toast.error('Failed to load design')
      return
    }

    // Convert to DesignFile format for the existing loadDesign flow
    const designFile: DesignFile = {
      schemaVersion: 1,
      metadata: {
        name: designData.name,
        createdAt: designData.createdAt,
        lastModifiedAt: designData.updatedAt,
        schemaVersion: 1,
      },
      gridSettings: {
        widthFt: designData.gridWidth,
        heightFt: designData.gridHeight,
        increment: designData.gridIncrement as DesignFile['gridSettings']['increment'],
      },
      grid: designData.versionData.grid,
      heightOverrides: designData.versionData.heightOverrides,
      placedObjects: designData.versionData.placedObjects,
    }

    const tabId = useTabStore.getState().openDesignTab(designFile, designData.name)
    useTabStore.getState().setTabCloudDesignId(tabId, designId)
    toast.success(`Opened: ${designData.name}`)
  }, [])

  /** Save As — always creates a new cloud copy (new name, no cloudDesignId) */
  const saveAsCloud = useCallback(async (name: string, description: string): Promise<'saved' | 'no-auth'> => {
    const user = useAuthStore.getState().user
    if (!user) {
      toast.error('Sign in to save designs')
      return 'no-auth'
    }

    const tab = useTabStore.getState().getActiveTab()
    if (!tab || tab.type !== 'design') return 'no-auth'

    const ds = useDesignStore.getState()
    const gridSettings = ds.gridSettings
    const versionData = getVersionData()

    const meta = await useDesignCloudStore.getState().createDesign(
      user.id,
      name,
      description,
      gridSettings,
      versionData,
    )
    // Link this tab to the new cloud design
    useTabStore.getState().setTabCloudDesignId(tab.id, meta.id)
    ds.setMetadata({ name })
    useTabStore.getState().setTabTitle(tab.id, name)
    useTabStore.getState().markActiveSaved()
    toast.success('Design saved as copy')
    return 'saved'
  }, [])

  // ── File Import/Export (unchanged) ───────────────────────────────

  /** Export design as JSON file download */
  const exportDesign = useCallback((fileName?: string) => {
    const file = useDesignStore.getState().toDesignFile()
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
    toast.success('Design exported')
  }, [])

  /** Import a design from a JSON file (opens in new tab, no cloud ID) */
  const importDesign = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const { file: designFile, errors } = parseDesignFile(text)
      if (!designFile) {
        toast.error(`Failed to import: ${errors[0]}`)
        return
      }
      useTabStore.getState().openDesignTab(designFile)
      toast.success(`Imported: ${designFile.metadata.name}`)
    }
    reader.readAsText(file)
  }, [])

  return {
    saveDesign,
    saveToCloud,
    saveAsCloud,
    openCloudDesign,
    exportDesign,
    importDesign,
  }
}
