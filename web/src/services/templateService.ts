import { supabase } from '@/lib/supabase'
import type { Template, WidgetPreset, WidgetAssembly } from '@/types/templates'

/** Map a Supabase row to our Template type */
function rowToTemplate(row: Record<string, unknown>): Template {
  const data = row.data as Record<string, unknown>
  const base = {
    id: row.id as string,
    kind: row.kind as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    category: (row.category as string) ?? '',
    tags: (row.tags as string[]) ?? [],
    visibility: (row.visibility as string) ?? 'user',
    createdBy: (row.created_by as string) ?? '',
    createdAt: (row.created_at as string) ?? '',
    thumbnailUrl: (row.thumbnail_url as string) ?? undefined,
    submissionStatus: row.submission_status as string | undefined,
  }

  if (row.kind === 'preset') {
    return {
      ...base,
      kind: 'preset',
      baseType: data.baseType as string,
      size: data.size as { widthFt: number; depthFt: number; heightFt: number },
      customProps: (data.customProps as Record<string, unknown>) ?? {},
    } as WidgetPreset
  }

  return {
    ...base,
    kind: 'assembly',
    boundingBox: data.boundingBox as { widthFt: number; depthFt: number; heightFt: number },
    objects: data.objects as WidgetAssembly['objects'],
  } as WidgetAssembly
}

/** Convert our Template type to a Supabase row */
function templateToRow(template: Template) {
  const { id, kind, name, description, category, tags, visibility, createdBy, thumbnailUrl, submissionStatus } = template

  const data = template.kind === 'preset'
    ? { baseType: template.baseType, size: template.size, customProps: template.customProps }
    : { boundingBox: template.boundingBox, objects: template.objects }

  return {
    id,
    kind,
    name,
    description,
    category,
    tags,
    visibility,
    created_by: createdBy,
    thumbnail_url: thumbnailUrl ?? null,
    submission_status: submissionStatus ?? null,
    data,
  }
}

/** Fetch all built-in templates (presets + assemblies) */
export async function fetchBuiltinTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('visibility', 'builtin')
  if (error) throw error
  return (data ?? []).map(rowToTemplate)
}

/** Fetch all templates owned by a user */
export async function fetchUserTemplates(uid: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('created_by', uid)
    .eq('visibility', 'user')
  if (error) throw error
  return (data ?? []).map(rowToTemplate)
}

/** Save a template to the user's library */
export async function saveUserTemplate(_uid: string, template: Template): Promise<void> {
  const row = templateToRow(template)
  const { error } = await supabase.from('templates').upsert(row)
  if (error) throw error
}

/** Save a built-in template (admin only) */
export async function saveBuiltinTemplate(template: Template): Promise<void> {
  const row = templateToRow(template)
  const { error } = await supabase.from('templates').upsert(row)
  if (error) throw error
}

/** Delete a template from the user's library */
export async function deleteUserTemplate(_uid: string, templateId: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', templateId)
  if (error) throw error
}

/** Delete a built-in template (admin only) */
export async function deleteBuiltinTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', templateId)
  if (error) throw error
}

/** Get a single template by ID */
export async function getTemplate(templateId: string, _uid?: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single()
  if (error || !data) return null
  return rowToTemplate(data)
}

/** Type guard helpers */
export function isPreset(t: Template): t is WidgetPreset {
  return t.kind === 'preset'
}

export function isAssembly(t: Template): t is WidgetAssembly {
  return t.kind === 'assembly'
}
