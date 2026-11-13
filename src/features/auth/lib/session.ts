import { isApiError } from '../../../shared/api/apiError'
import { configureAuth } from '../../../shared/api/httpClient'
import { authApi } from '../api/authApi'

/**
 * Access token is kept in memory only (never in localStorage/sessionStorage).
 * After a page reload the session is restored through `POST /auth/refresh`,
 * which relies on the backend's HttpOnly refresh-token cookie.
 */
let accessToken: string | null = null
const listeners = new Set<() => void>()

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  if (token === accessToken) return
  accessToken = token
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const expiredListeners = new Set<() => void>()

/** Notified when an active session is ended by the backend (refresh token rejected). */
export function onSessionExpired(listener: () => void): () => void {
  expiredListeners.add(listener)
  return () => expiredListeners.delete(listener)
}

let inFlightRefresh: Promise<string | null> | null = null

/**
 * Exchanges the refresh-token cookie for a new access token.
 *
 * The backend rotates the refresh token on every call and treats reuse of a rotated
 * token as a security event (all of the user's sessions are revoked). Concurrent callers
 * therefore share one in-flight request.
 *
 * Resolves `null` when the backend rejects the refresh token (no session).
 * Rejects on network/server errors so callers can offer a retry.
 */
export function refreshAccessToken(): Promise<string | null> {
  inFlightRefresh ??= authApi
    .refresh()
    .then(({ accessToken: token }) => {
      setAccessToken(token)
      return token
    })
    .catch((error: unknown) => {
      if (isApiError(error) && error.kind === 'http' && error.status < 500) {
        if (accessToken !== null) expiredListeners.forEach((listener) => listener())
        setAccessToken(null)
        return null
      }
      throw error
    })
    .finally(() => {
      inFlightRefresh = null
    })
  return inFlightRefresh
}

/** For authenticated API calls: a failed refresh (for any reason) ends the session. */
async function refreshForRetry(): Promise<string | null> {
  try {
    return await refreshAccessToken()
  } catch {
    return null
  }
}

configureAuth({ getAccessToken, refreshAccessToken: refreshForRetry })
