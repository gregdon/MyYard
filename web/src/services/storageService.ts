import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

/** Upload a data URL image to Firebase Storage and return the download URL */
export async function uploadTemplateImage(
  templateId: string,
  dataUrl: string,
  index: number,
): Promise<string> {
  const path = `templates/${templateId}/${index === 0 ? 'thumbnail' : `screenshot-${index}`}.png`
  const storageRef = ref(storage, path)
  await uploadString(storageRef, dataUrl, 'data_url')
  return getDownloadURL(storageRef)
}
