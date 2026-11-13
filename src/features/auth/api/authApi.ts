import { request } from '../../../shared/api/httpClient'

/**
 * Types mirror the verified backend DTOs (foodlog-backend `develop`).
 * See docs/auth-api-integration.md.
 */

/** `UserRegistrationRequestDto` */
export interface RegisterRequest {
  email: string
  password: string
}

/** `UserLoginRequestDto` */
export interface LoginRequest {
  email: string
  password: string
}

/** `AccessTokenDto` */
export interface AccessTokenResponse {
  accessToken: string
}

export const authApi = {
  /** `POST /api/auth/register` → 201 + refresh-token cookie. */
  register: (body: RegisterRequest) =>
    request<AccessTokenResponse>('/auth/register', { method: 'POST', body }),

  /** `POST /api/auth/login` → 200 + refresh-token cookie. */
  login: (body: LoginRequest) =>
    request<AccessTokenResponse>('/auth/login', { method: 'POST', body }),

  /** `POST /api/auth/refresh` — uses the HttpOnly refresh-token cookie, rotates it. */
  refresh: () => request<AccessTokenResponse>('/auth/refresh', { method: 'POST' }),

  /** `POST /api/auth/logout` → 204, revokes the refresh token and clears the cookie. */
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
}
