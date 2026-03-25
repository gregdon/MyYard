import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Template, WidgetPreset, WidgetAssembly } from '@/types/templates'

const BUILTIN_COL = 'templates'

function userCol(uid: string) {
  return `users/${uid}/templates`
}

/** Fetch all built-in templates (presets + assemblies) */
export async function fetchBuiltinTemplates(): Promise<Template[]> {
  const snap = await getDocs(
    query(collection(db, BUILTIN_COL), where('visibility', '==', 'builtin'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Template)
}

/** Fetch all templates owned by a user */
export async function fetchUserTemplates(uid: string): Promise<Template[]> {
  const snap = await getDocs(collection(db, userCol(uid)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Template)
}

/** Save a template to the user's library */
export async function saveUserTemplate(uid: string, template: Template): Promise<void> {
  const ref = doc(db, userCol(uid), template.id)
  const { id: _id, ...data } = template
  await setDoc(ref, data)
}

/** Save a built-in template (admin only) */
export async function saveBuiltinTemplate(template: Template): Promise<void> {
  const ref = doc(db, BUILTIN_COL, template.id)
  const { id: _id, ...data } = template
  await setDoc(ref, data)
}

/** Delete a template from the user's library */
export async function deleteUserTemplate(uid: string, templateId: string): Promise<void> {
  await deleteDoc(doc(db, userCol(uid), templateId))
}

/** Delete a built-in template (admin only) */
export async function deleteBuiltinTemplate(templateId: string): Promise<void> {
  await deleteDoc(doc(db, BUILTIN_COL, templateId))
}

/** Get a single template by ID (checks builtin first, then user) */
export async function getTemplate(templateId: string, uid?: string): Promise<Template | null> {
  const builtinSnap = await getDoc(doc(db, BUILTIN_COL, templateId))
  if (builtinSnap.exists()) return { id: builtinSnap.id, ...builtinSnap.data() } as Template

  if (uid) {
    const userSnap = await getDoc(doc(db, userCol(uid), templateId))
    if (userSnap.exists()) return { id: userSnap.id, ...userSnap.data() } as Template
  }

  return null
}

/** Type guard helpers */
export function isPreset(t: Template): t is WidgetPreset {
  return t.kind === 'preset'
}

export function isAssembly(t: Template): t is WidgetAssembly {
  return t.kind === 'assembly'
}
