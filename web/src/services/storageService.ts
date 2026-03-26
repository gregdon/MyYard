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
