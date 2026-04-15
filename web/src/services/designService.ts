import { supabase } from '@/lib/supabase'
import type { DesignMeta, DesignVersionData, DesignWithData } from '@/types/cloudDesign'

// ── Row Mappers ────────────────────────────────────────────────────

function rowToDesignMeta(row: Record<string, unknown>): DesignMeta {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    gridWidth: row.grid_width as number,
    gridHeight: row.grid_height as number,
    gridIncrement: row.grid_increment as string,
    groundColor: row.ground_color as string,
    gradeNw: row.grade_nw as number,
    gradeNe: row.grade_ne as number,
    gradeSw: row.grade_sw as number,
    gradeSe: row.grade_se as number,
    projectId: (row.project_id as string) ?? null,
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// ── Public API ─────────────────────────────────────────────────────

/** Fetch all designs for a user (metadata only, no canvas data) */
export async function fetchUserDesigns(uid: string): Promise<DesignMeta[]> {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .eq('user_id', uid)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(rowToDesignMeta)
}

/** Fetch a single design with its latest version data */
export async function fetchDesign(designId: string): Promise<DesignWithData | null> {
  // Fetch the design row
  const { data: designRow, error: designErr } = await supabase
    .from('designs')
    .select('*')
    .eq('id', designId)
    .single()
  if (designErr || !designRow) return null

  // Fetch the latest version
  const { data: versionRow, error: versionErr } = await supabase
    .from('design_versions')
    .select('*')
    .eq('design_id', designId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()
  if (versionErr || !versionRow) return null

  const meta = rowToDesignMeta(designRow)
  return {
    ...meta,
    versionNumber: versionRow.version_number as number,
    versionData: versionRow.data as DesignVersionData,
  }
}

/** Create a new design with its first version */
export async function createDesign(
  uid: string,
  name: string,
  description: string,
  gridSettings: { widthFt: number; heightFt: number; increment: string },
  versionData: DesignVersionData,
): Promise<DesignMeta> {
  const { data: designRow, error: designErr } = await supabase
    .from('designs')
    .insert({
      user_id: uid,
      name,
      description: description || null,
      grid_width: gridSettings.widthFt,
      grid_height: gridSettings.heightFt,
      grid_increment: gridSettings.increment,
    })
    .select()
    .single()
  if (designErr || !designRow) throw designErr ?? new Error('Failed to create design')

  const { error: versionErr } = await supabase
    .from('design_versions')
    .insert({
      design_id: designRow.id,
      version_number: 1,
      data: versionData,
    })
  if (versionErr) throw versionErr

  return rowToDesignMeta(designRow)
}

/** Save an existing design — updates metadata + upserts version 1 */
export async function saveDesign(
  designId: string,
  name: string,
  description: string,
  gridSettings: { widthFt: number; heightFt: number; increment: string },
  versionData: DesignVersionData,
): Promise<void> {
  const { error: metaErr } = await supabase
    .from('designs')
    .update({
      name,
      description: description || null,
      grid_width: gridSettings.widthFt,
      grid_height: gridSettings.heightFt,
      grid_increment: gridSettings.increment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', designId)
  if (metaErr) throw metaErr

  // Upsert version 1 (no versioning yet — always overwrite)
  // First check if version exists
  const { data: existing } = await supabase
    .from('design_versions')
    .select('id')
    .eq('design_id', designId)
    .eq('version_number', 1)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('design_versions')
      .update({ data: versionData, created_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('design_versions')
      .insert({ design_id: designId, version_number: 1, data: versionData })
    if (error) throw error
  }
}

/** Delete a design (cascade deletes versions) */
export async function deleteDesign(designId: string): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .delete()
    .eq('id', designId)
  if (error) throw error
}
