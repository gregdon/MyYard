import { create } from 'zustand'
import type {
  Template, WidgetPreset, WidgetAssembly, AssemblyObject,
} from '@/types/templates'
import type { PlacedObject3D } from '@/types/design'
import { PREFAB_CATALOG } from '@/constants/prefabs'
import {
  fetchBuiltinTemplates, fetchUserTemplates,
  saveUserTemplate, saveBuiltinTemplate,
  deleteUserTemplate, deleteBuiltinTemplate,
  isPreset,
} from '@/services/templateService'

interface TemplateState {
  templates: Template[]
  loading: boolean
  error: string | null

  /** Load all templates (builtin + user) */
  loadTemplates: (uid?: string) => Promise<void>

  /** Place a preset onto the canvas — returns the new PlacedObject3D */
  createFromPreset: (preset: WidgetPreset, position: [number, number, number]) => PlacedObject3D

  /** Place an assembly onto the canvas — returns array of new PlacedObject3D */
  createFromAssembly: (assembly: WidgetAssembly, position: [number, number, number]) => PlacedObject3D[]

  /** Extract a preset from a placed object */
  extractPreset: (obj: PlacedObject3D, meta: { name: string; description: string; category: string; tags: string[]; visibility: 'builtin' | 'user'; createdBy: string }) => WidgetPreset

  /** Extract an assembly from selected objects */
  extractAssembly: (objects: PlacedObject3D[], meta: { name: string; description: string; category: string; tags: string[]; visibility: 'builtin' | 'user'; createdBy: string }) => WidgetAssembly

  /** Save a template (routes to builtin or user collection) */
  saveTemplate: (template: Template, uid: string) => Promise<void>

  /** Delete a template */
  deleteTemplate: (templateId: string, uid: string, isBuiltin: boolean) => Promise<void>

  /** Get presets only */
  presets: () => WidgetPreset[]

  /** Get assemblies only */
  assemblies: () => WidgetAssembly[]
}

export const useTemplateStore = create<TemplateState>()((set, get) => ({
  templates: [],
  loading: false,
  error: null,

  async loadTemplates(uid?: string) {
    set({ loading: true, error: null })
    try {
      const builtin = await fetchBuiltinTemplates()
      const user = uid ? await fetchUserTemplates(uid) : []
      set({ templates: [...builtin, ...user], loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createFromPreset(preset, position) {
    const prefab = PREFAB_CATALOG.find(p => p.type === preset.baseType)
    return {
      id: crypto.randomUUID(),
      type: preset.baseType,
      position,
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
      size: { ...preset.size },
      customProps: { ...preset.customProps },
      name: prefab?.label,
    }
  },

  createFromAssembly(assembly, position) {
    return assembly.objects.map(aObj => ({
      id: crypto.randomUUID(),
      type: aObj.type,
      position: [
        position[0] + aObj.relativePosition[0],
        position[1] + aObj.relativePosition[1],
        position[2] + aObj.relativePosition[2],
      ] as [number, number, number],
      rotation: [...aObj.rotation] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
      size: { ...aObj.size },
      customProps: { ...aObj.customProps },
    }))
  },

  extractPreset(obj, meta) {
    return {
      id: crypto.randomUUID(),
      kind: 'preset' as const,
      name: meta.name,
      description: meta.description,
      category: meta.category,
      tags: meta.tags,
      baseType: obj.type,
      size: { ...obj.size },
      customProps: { ...(obj.customProps ?? {}) },
      visibility: meta.visibility,
      createdBy: meta.createdBy,
      createdAt: new Date().toISOString(),
    }
  },

  extractAssembly(objects, meta) {
    // Compute center of all objects
    let minX = Infinity, maxX = -Infinity
    let minZ = Infinity, maxZ = -Infinity
    let maxY = 0
    for (const obj of objects) {
      minX = Math.min(minX, obj.position[0])
      maxX = Math.max(maxX, obj.position[0] + obj.size.widthFt)
      minZ = Math.min(minZ, obj.position[2])
      maxZ = Math.max(maxZ, obj.position[2] + obj.size.depthFt)
      maxY = Math.max(maxY, obj.size.heightFt)
    }
    const centerX = (minX + maxX) / 2
    const centerZ = (minZ + maxZ) / 2

    const assemblyObjects: AssemblyObject[] = objects.map(obj => ({
      type: obj.type,
      relativePosition: [
        obj.position[0] - centerX,
        obj.position[1],
        obj.position[2] - centerZ,
      ] as [number, number, number],
      rotation: [...obj.rotation] as [number, number, number],
      size: { ...obj.size },
      customProps: { ...(obj.customProps ?? {}) },
    }))

    return {
      id: crypto.randomUUID(),
      kind: 'assembly' as const,
      name: meta.name,
      description: meta.description,
      category: meta.category,
      tags: meta.tags,
      boundingBox: {
        widthFt: maxX - minX,
        depthFt: maxZ - minZ,
        heightFt: maxY,
      },
      objects: assemblyObjects,
      visibility: meta.visibility,
      createdBy: meta.createdBy,
      createdAt: new Date().toISOString(),
    }
  },

  async saveTemplate(template, uid) {
    if (template.visibility === 'builtin') {
      await saveBuiltinTemplate(template)
    } else {
      await saveUserTemplate(uid, template)
    }
    // Refresh the list
    const templates = [...get().templates.filter(t => t.id !== template.id), template]
    set({ templates })
  },

  async deleteTemplate(templateId, uid, isBuiltin) {
    if (isBuiltin) {
      await deleteBuiltinTemplate(templateId)
    } else {
      await deleteUserTemplate(uid, templateId)
    }
    set({ templates: get().templates.filter(t => t.id !== templateId) })
  },

  presets() {
    return get().templates.filter(isPreset)
  },

  assemblies() {
    return get().templates.filter(t => t.kind === 'assembly') as WidgetAssembly[]
  },
}))
