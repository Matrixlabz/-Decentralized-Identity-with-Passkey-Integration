import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Identity, PasskeyCredential } from '@decentralized-identity/shared'

interface AuthState {
  isAuthenticated: boolean
  user: Identity | null
  passkeyCredentials: PasskeyCredential[]
  token: string | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  setAuthenticated: (isAuthenticated: boolean) => void
  setUser: (user: Identity | null) => void
  setPasskeyCredentials: (credentials: PasskeyCredential[]) => void
  addPasskeyCredential: (credential: PasskeyCredential) => void
  removePasskeyCredential: (credentialId: string) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  initializeAuth: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      passkeyCredentials: [],
      token: null,
      isLoading: false,
      error: null,

      // Actions
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      setUser: (user) => set({ user }),
      
      setPasskeyCredentials: (credentials) => set({ passkeyCredentials: credentials }),
      
      addPasskeyCredential: (credential) => set((state) => ({
        passkeyCredentials: [...state.passkeyCredentials, credential]
      })),
      
      removePasskeyCredential: (credentialId) => set((state) => ({
        passkeyCredentials: state.passkeyCredentials.filter(c => c.id !== credentialId)
      })),
      
      setToken: (token) => set({ token }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      initializeAuth: () => {
        const token = get().token
        const user = get().user
        
        if (token && user) {
          set({ isAuthenticated: true, isLoading: false })
        } else {
          set({ isAuthenticated: false, isLoading: false })
        }
      },
      
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          error: null
        })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        passkeyCredentials: state.passkeyCredentials,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
