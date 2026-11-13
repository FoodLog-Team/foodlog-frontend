import { createContext, useContext } from 'react'
import type { LoginRequest, RegisterRequest } from '../api/authApi'

export type AuthStatus =
  /** Trying to restore a session from the refresh-token cookie. */
  | 'restoring'
  /** Session could not be checked (backend unreachable or failing). */
  | 'unavailable'
  | 'authenticated'
  | 'unauthenticated'

export interface AuthContextValue {
  status: AuthStatus
  /** True when an active session was ended by the backend; cleared on the next sign-in. */
  sessionExpired: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  retryRestore: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
