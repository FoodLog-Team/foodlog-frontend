import { ApiError, type FieldErrors } from './apiError'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
const DEFAULT_TIMEOUT_MS = 15_000

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  /** Attach `Authorization: Bearer <accessToken>` and retry once after a token refresh on 401. */
  auth?: boolean
  timeoutMs?: number
}

interface AuthHandlers {
  getAccessToken: () => string | null
  /** Resolves with a new access token, or `null` if the session can no longer be refreshed. */
  refreshAccessToken: () => Promise<string | null>
}

let authHandlers: AuthHandlers | null = null

/** Registered once by the auth feature so this client stays independent of it. */
export function configureAuth(handlers: AuthHandlers): void {
  authHandlers = handlers
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options, authHandlers?.getAccessToken() ?? null)

  if (response.status === 401 && options.auth && authHandlers) {
    const refreshed = await authHandlers.refreshAccessToken()
    if (refreshed) {
      return parse<T>(await send(path, options, refreshed))
    }
  }

  return parse<T>(response)
}

async function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const { method = 'GET', body, auth = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // The refresh token lives in an HttpOnly cookie; the browser must send and store it.
      credentials: 'include',
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError('timeout', 0, 'Request timed out')
    throw new ApiError('network', 0, error instanceof Error ? error.message : 'Network error')
  } finally {
    window.clearTimeout(timer)
  }
}

async function parse<T>(response: Response): Promise<T> {
  const data = await readJson(response)

  if (response.ok) return data as T

  const payload = (data ?? {}) as { message?: unknown; errors?: unknown; detail?: unknown }
  const message =
    typeof payload.message === 'string'
      ? payload.message
      : typeof payload.detail === 'string'
        ? payload.detail
        : response.statusText
  throw new ApiError('http', response.status, message, toFieldErrors(payload.errors))
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function toFieldErrors(value: unknown): FieldErrors {
  if (!value || typeof value !== 'object') return {}
  const result: FieldErrors = {}
  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      result[field] = messages
        .filter((m): m is string => typeof m === 'string')
        .map((m) => m.replace(/\s+/g, ' ').trim())
    }
  }
  return result
}
