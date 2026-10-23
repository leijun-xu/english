import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Token, UserUpdate, WebResultUser } from '@en/common/user'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthMode } from '../types'

interface AppState {
  user: WebResultUser | null
  hydrated: boolean
  authOpen: boolean
  authMode: AuthMode
  searchOpen: boolean
  setHydrated: (hydrated: boolean) => void
  setUser: (user: WebResultUser) => void
  logout: () => void
  updateToken: (token: Token) => void
  updateUser: (user: UserUpdate) => void
  updateWordNumber: (wordNumber: number) => void
  showAuth: (mode?: AuthMode) => void
  hideAuth: () => void
  setAuthMode: (mode: AuthMode) => void
  setSearchOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      authOpen: false,
      authMode: 'login',
      searchOpen: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setUser: (user) => set({ user, authOpen: false }),
      logout: () => set({ user: null }),
      updateToken: (token) =>
        set((state) => ({ user: state.user ? { ...state.user, token } : null })),
      updateUser: (user) =>
        set((state) => ({ user: state.user ? { ...state.user, ...user } : null })),
      updateWordNumber: (wordNumber) =>
        set((state) => ({ user: state.user ? { ...state.user, wordNumber } : null })),
      showAuth: (authMode = 'login') => set({ authOpen: true, authMode }),
      hideAuth: () => set({ authOpen: false }),
      setAuthMode: (authMode) => set({ authMode }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
    }),
    {
      name: 'english-native-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
)

export const requireLogin = () => {
  const state = useAppStore.getState()
  if (state.user) return true
  state.showAuth()
  return false
}
