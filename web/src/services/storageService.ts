import { supabase } from '@/lib/supabase'

/** Convert a data URL to a Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i)
  }
  return new Blob([arr], { type: mime })
}

/** Upload a data URL image to Supabase Storage and return the public URL */
export async function uploadTemplateImage(
  templateId: string,
  dataUrl: string,
  index: number,
): Promise<string> {
  const filename = index === 0 ? 'thumbnail.png' : `screenshot-${index}.png`
  const path = `${templateId}/${filename}`
  const blob = dataUrlToBlob(dataUrl)

  const { error } = await supabase.storage
    .from('templates')
    .upload(path, blob, {
      contentType: 'image/png',
      upsert: true,
    })
  if (error) throw error

  const { data } = supabase.storage
    .from('templates')
    .getPublicUrl(path)

  return data.publicUrl
}

/** Save image record to template_images table */
export async function saveTemplateImageRecord(
  templateId: string,
  url: string,
  isPrimary: boolean,
  sortOrder: number,
): Promise<string> {
  const { data, error } = await supabase
    .from('template_images')
    .insert({
      template_id: templateId,
      url,
      is_primary: isPrimary,
      sort_order: sortOrder,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

/** Get all images for a template, ordered by sort_order */
export async function getTemplateImages(
  templateId: string,
): Promise<{ id: string; url: string; isPrimary: boolean; sortOrder: number }[]> {
  const { data, error } = await supabase
    .from('template_images')
    .select('id, url, is_primary, sort_order')
    .eq('template_id', templateId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    url: r.url,
    isPrimary: r.is_primary,
    sortOrder: r.sort_order,
  }))
}

/** Delete a template image record and its storage file */
export async function deleteTemplateImage(
  imageId: string,
  storagePath: string,
): Promise<void> {
  await supabase.storage.from('templates').remove([storagePath])
  const { error } = await supabase
    .from('template_images')
    .delete()
    .eq('id', imageId)
  if (error) throw error
}

/** Set a specific image as the primary for its template */
export async function setPrimaryImage(
  templateId: string,
  imageId: string,
): Promise<void> {
  // Unset all as non-primary
  await supabase
    .from('template_images')
    .update({ is_primary: false })
    .eq('template_id', templateId)
  // Set the chosen one as primary
  const { error } = await supabase
    .from('template_images')
    .update({ is_primary: true })
    .eq('id', imageId)
  if (error) throw error
}

/** Upload image + save record in one call */
export async function uploadAndSaveTemplateImage(
  templateId: string,
  dataUrl: string,
  isPrimary: boolean,
  sortOrder: number,
): Promise<{ id: string; url: string }> {
  const url = await uploadTemplateImage(templateId, dataUrl, sortOrder)
  const id = await saveTemplateImageRecord(templateId, url, isPrimary, sortOrder)
  return { id, url }
}
