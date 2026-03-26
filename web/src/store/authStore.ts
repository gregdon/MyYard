import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, UserRole } from '@/types/auth'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

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

/** Map a Supabase user + profile to our User type */
async function mapSupabaseUser(sbUser: SupabaseUser): Promise<User> {
  let role: UserRole = 'user'
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', sbUser.id)
      .single()
    if (data?.role) {
      role = data.role as UserRole
    }
  } catch {
    // Profile may not exist yet; default to 'user'
  }

  const meta = sbUser.user_metadata ?? {}
  return {
    id: sbUser.id,
    email: sbUser.email ?? '',
    name: meta.full_name ?? meta.name ?? sbUser.email?.split('@')[0] ?? '',
    role,
    emailVerified: !!sbUser.email_confirmed_at,
    photoURL: meta.avatar_url ?? meta.picture ?? undefined,
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: () => {
    // Check existing session on load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = await mapSupabaseUser(session.user)
        set({ user, isAuthenticated: true, isLoading: false })
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (session?.user) {
          const user = await mapSupabaseUser(session.user)
          set({ user, isAuthenticated: true, isLoading: false })
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  },

  loginWithEmail: async (email, password) => {
    set({ error: null, isLoading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  loginWithGoogle: async () => {
    set({ error: null, isLoading: true })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
      // Redirect flow - page will reload, onAuthStateChange picks up the session
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  register: async (name, email, password) => {
    set({ error: null, isLoading: true })
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      })
      if (error) throw error
      // Supabase auto-sends verification email
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
  },

  resetPassword: async (email) => {
    set({ error: null })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed'
      set({ error: message })
      throw err
    }
  },

  resendVerification: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !user.email_confirmed_at && user.email) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })
      if (error) throw error
    }
  },

  clearError: () => set({ error: null }),
}))
