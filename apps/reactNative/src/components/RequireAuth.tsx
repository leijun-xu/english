import { Redirect } from 'expo-router'
import { useEffect, type PropsWithChildren } from 'react'
import { useAppStore } from '../store/app'

export function RequireAuth({ children }: PropsWithChildren) {
  const user = useAppStore((state) => state.user)
  const hydrated = useAppStore((state) => state.hydrated)
  const showAuth = useAppStore((state) => state.showAuth)
  useEffect(() => {
    if (hydrated && !user) showAuth()
  }, [hydrated, showAuth, user])
  if (!hydrated) return null
  return user ? children : <Redirect href="/" />
}
