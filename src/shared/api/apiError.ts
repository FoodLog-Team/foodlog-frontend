export type ApiErrorKind = 'http' | 'network' | 'timeout'

/** Field-level validation errors as returned by the backend (`ValidationErrorResponse.errors`). */
export type FieldErrors = Record<string, string[]>

/**
 * Normalised error thrown by the HTTP client.
 * `message` is the backend's message when available and is never shown to users directly;
 * UI code maps errors to safe, user-facing English text.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(kind: ApiErrorKind, status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later.'

/** Safe fallback messages for errors that are not specific to a particular form. */
export function describeError(error: unknown): string {
  if (!isApiError(error)) return GENERIC_ERROR_MESSAGE
  if (error.kind === 'network') {
    return "We couldn't reach FoodLog. Check your connection and try again."
  }
  if (error.kind === 'timeout') return 'The request took too long. Please try again.'
  return GENERIC_ERROR_MESSAGE
}
