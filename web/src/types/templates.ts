export type TemplateVisibility = 'builtin' | 'user' | 'submitted'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected'
export type TemplateKind = 'preset' | 'assembly'

/** A single widget with pre-configured properties */
export interface WidgetPreset {
  id: string
  kind: 'preset'
  name: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl?: string
  baseType: string                          // prefab type from PREFAB_CATALOG
  size: { widthFt: number; depthFt: number; heightFt: number }
  customProps: Record<string, unknown>
  visibility: TemplateVisibility
  createdBy: string
  createdAt: string
  submissionStatus?: SubmissionStatus
}

/** A positioned widget within an assembly */
export interface AssemblyObject {
  type: string
  relativePosition: [number, number, number]
  rotation: [number, number, number]
  size: { widthFt: number; depthFt: number; heightFt: number }
  customProps: Record<string, unknown>
}

/** A group of widgets with relative positions */
export interface WidgetAssembly {
  id: string
  kind: 'assembly'
  name: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl?: string
  boundingBox: { widthFt: number; depthFt: number; heightFt: number }
  objects: AssemblyObject[]
  visibility: TemplateVisibility
  createdBy: string
  createdAt: string
  submissionStatus?: SubmissionStatus
}

export type Template = WidgetPreset | WidgetAssembly
