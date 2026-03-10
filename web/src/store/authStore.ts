import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean

  login: (email: string, _password: string) => void
  register: (name: string, email: string, _password: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,

  login: (email, _password) => {
    // Mock auth — no real backend
    set({
      user: {
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0],
      },
      isAuthenticated: true,
    })
  },

  register: (name, email, _password) => {
    set({
      user: {
        id: crypto.randomUUID(),
        email,
        name,
      },
      isAuthenticated: true,
    })
  },

  logout: () => {
    set({ user: null, isAuthenticated: false })
  },
}))
