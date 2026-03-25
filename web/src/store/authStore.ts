import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { User, UserRole } from '@/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  initialize: () => () => void
  loginWithEmail: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  clearError: () => void
}

const googleProvider = new GoogleAuthProvider()

/** Map a Firebase user + Firestore profile to our User type */
async function mapFirebaseUser(fbUser: FirebaseUser): Promise<User> {
  // Try to read role from Firestore user doc
  let role: UserRole = 'user'
  try {
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
    if (userDoc.exists()) {
      role = (userDoc.data().role as UserRole) || 'user'
    }
  } catch {
    // Firestore may be unreachable; default to 'user'
  }

  return {
    id: fbUser.uid,
    email: fbUser.email ?? '',
    name: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? '',
    role,
    emailVerified: fbUser.emailVerified,
    photoURL: fbUser.photoURL ?? undefined,
  }
}

/** Create or update user document in Firestore */
async function ensureUserDoc(fbUser: FirebaseUser) {
  const ref = doc(db, 'users', fbUser.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      email: fbUser.email,
      displayName: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? '',
      role: 'user',
      createdAt: new Date().toISOString(),
    })
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const user = await mapFirebaseUser(fbUser)
        set({ user, isAuthenticated: true, isLoading: false })
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    })
    return unsubscribe
  },

  loginWithEmail: async (email, password) => {
    set({ error: null, isLoading: true })
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  loginWithGoogle: async () => {
    set({ error: null, isLoading: true })
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await ensureUserDoc(result.user)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  register: async (name, email, password) => {
    set({ error: null, isLoading: true })
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      await ensureUserDoc(cred.user)
      await sendEmailVerification(cred.user)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  logout: async () => {
    await signOut(auth)
  },

  resetPassword: async (email) => {
    set({ error: null })
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed'
      set({ error: message })
      throw err
    }
  },

  resendVerification: async () => {
    const fbUser = auth.currentUser
    if (fbUser && !fbUser.emailVerified) {
      await sendEmailVerification(fbUser)
    }
  },

  clearError: () => set({ error: null }),
}))
