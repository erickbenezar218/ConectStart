'use client'

import { create } from 'zustand'

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'COMERCIAL'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('cf_token', token)
    localStorage.setItem('cf_user', JSON.stringify(user))
    // Set cookie so Next.js middleware can check it
    document.cookie = `cf_token=${token}; path=/; max-age=28800; SameSite=Lax`
    set({ user, token, isLoading: false })
  },

  clearAuth: () => {
    localStorage.removeItem('cf_token')
    localStorage.removeItem('cf_user')
    document.cookie = 'cf_token=; path=/; max-age=0'
    set({ user: null, token: null, isLoading: false })
  },

  loadFromStorage: () => {
    try {
      const token = localStorage.getItem('cf_token')
      const raw = localStorage.getItem('cf_user')
      if (token && raw) {
        const user = JSON.parse(raw) as AuthUser
        set({ user, token, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))
