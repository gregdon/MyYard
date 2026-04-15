import { create } from 'zustand'
import type { DesignMeta, DesignVersionData, DesignWithData } from '@/types/cloudDesign'
import {
  fetchUserDesigns,
  fetchDesign,
  createDesign,
  saveDesign,
  deleteDesign,
} from '@/services/designService'

interface DesignCloudState {
  designs: DesignMeta[]
  loading: boolean
  error: string | null

  loadDesigns: (uid: string) => Promise<void>
  createDesign: (
    uid: string,
    name: string,
    description: string,
    gridSettings: { widthFt: number; heightFt: number; increment: string },
    versionData: DesignVersionData,
  ) => Promise<DesignMeta>
  saveDesign: (
    designId: string,
    name: string,
    description: string,
    gridSettings: { widthFt: number; heightFt: number; increment: string },
    versionData: DesignVersionData,
  ) => Promise<void>
  deleteDesign: (designId: string) => Promise<void>
  openDesign: (designId: string) => Promise<DesignWithData | null>
}

export const useDesignCloudStore = create<DesignCloudState>()((set, get) => ({
  designs: [],
  loading: false,
  error: null,

  async loadDesigns(uid: string) {
    set({ loading: true, error: null })
    try {
      const designs = await fetchUserDesigns(uid)
      set({ designs, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  async createDesign(uid, name, description, gridSettings, versionData) {
    const meta = await createDesign(uid, name, description, gridSettings, versionData)
    set({ designs: [meta, ...get().designs] })
    return meta
  },

  async saveDesign(designId, name, description, gridSettings, versionData) {
    await saveDesign(designId, name, description, gridSettings, versionData)
    // Update local list
    set({
      designs: get().designs.map(d =>
        d.id === designId
          ? { ...d, name, description, updatedAt: new Date().toISOString() }
          : d
      ),
    })
  },

  async deleteDesign(designId) {
    await deleteDesign(designId)
    set({ designs: get().designs.filter(d => d.id !== designId) })
  },

  async openDesign(designId) {
    return fetchDesign(designId)
  },
}))
