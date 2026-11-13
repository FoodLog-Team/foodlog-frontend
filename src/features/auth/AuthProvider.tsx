import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { authApi, type LoginRequest, type RegisterRequest } from './api/authApi'
import { AuthContext, type AuthContextValue, type AuthStatus } from './lib/authContext'
import {
  getAccessToken,
  onSessionExpired,
  refreshAccessToken,
  setAccessToken,
  subscribe,
} from './lib/session'

type RestoreState = 'pending' | 'done' | 'failed'

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribe, getAccessToken)
  const [restore, setRestore] = useState<RestoreState>('pending')
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => onSessionExpired(() => setSessionExpired(true)), [])

  useEffect(() => {
    if (restore !== 'pending') return
    let active = true
    // Shared in-flight request: safe under StrictMode double effects.
    refreshAccessToken()
      .then(() => active && setRestore('done'))
      .catch(() => active && setRestore('failed'))
    return () => {
      active = false
    }
  }, [restore])

  const login = useCallback(async (credentials: LoginRequest) => {
    const { accessToken } = await authApi.login(credentials)
    setSessionExpired(false)
    setAccessToken(accessToken)
    setRestore('done')
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    // The backend authenticates the user on successful registration (201 + token).
    const { accessToken } = await authApi.register(data)
    setSessionExpired(false)
    setAccessToken(accessToken)
    setRestore('done')
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Local session is cleared regardless; the access token expires on its own.
    } finally {
      setSessionExpired(false)
      setAccessToken(null)
    }
  }, [])

  const retryRestore = useCallback(() => setRestore('pending'), [])

  const status: AuthStatus = token
    ? 'authenticated'
    : restore === 'pending'
      ? 'restoring'
      : restore === 'failed'
        ? 'unavailable'
        : 'unauthenticated'

  const value = useMemo<AuthContextValue>(
    () => ({ status, sessionExpired, login, register, logout, retryRestore }),
    [status, sessionExpired, login, register, logout, retryRestore],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
