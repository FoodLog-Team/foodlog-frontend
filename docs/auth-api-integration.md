# Auth API integration

Frontend-side record of the backend authentication contract used by FoodLog.
Source: `FoodLog-Team/foodlog-backend`, branch `develop` (commit `36a9788`).
The backend is owned by another developer — nothing here was changed in the backend repository.

**Verification status:** verified against backend source (controllers, DTOs, security config,
exception handler) **and** live on 2026-11-13. The backend was started with `docker compose up --build`
(PostgreSQL 17 container; all 4 Flyway migrations applied). Each endpoint below was called with
`curl` directly on `:8080` and through the browser via the Vite proxy.
Re-verified on 2026-11-18 against the Swagger spec (`/api/v3/api-docs`) and live calls for the
registration change (`confirmPassword`, KEY-28). The other auth endpoints are unchanged.

## Base URL

| Item | Value |
|------|-------|
| Server port | `8080` (`server.port`) |
| Context path | `/api` (`server.servlet.context-path`) |
| Local base URL | `http://localhost:8080/api` |
| Frontend setting | `VITE_API_BASE_URL` (default `/api`, proxied by Vite to `VITE_DEV_PROXY_TARGET`, default `http://localhost:8080`) |
| Swagger UI | `http://localhost:8080/api/swagger-ui.html` |

**CORS is disabled** in `SecurityConfig` (`.cors(AbstractHttpConfigurer::disable)`) and no CORS
mappings exist. Browsers therefore cannot call the backend cross-origin. In development the Vite dev
and preview servers proxy `/api` to the backend, which makes requests same-origin.

## Token model

- **Access token:** JWT (HS256, issuer `foodlog`, `sub` = user id), returned in the JSON body as
  `accessToken`. Send it as `Authorization: Bearer <accessToken>`. Lifetime comes from `jwt.expiration` (ms).
- **Refresh token:** opaque, stored in the HttpOnly cookie `refresh_token_cookie`
  (`SameSite=Strict`, `Secure` = `REFRESH_TOKEN_COOKIE_SECURE`, `Path` = `REFRESH_TOKEN_COOKIE_PATH`).
  It is rotated on every refresh. Reusing a rotated token revokes all of the user's sessions.
- Server sessions are stateless and CSRF protection is disabled.

### Frontend handling

- The access token is held **in memory only** (no localStorage/sessionStorage).
- All requests use `credentials: 'include'` so the browser stores and sends the refresh cookie.
- On app load the session is restored with `POST /auth/refresh`.
  Concurrent refresh calls share one in-flight request, so rotation never sends the same token twice.
- On a `401` from an authenticated request the client refreshes once and retries. If the refresh
  is rejected, the local session is cleared and the user is sent to `/login`.

## Endpoints

All endpoints: `Content-Type: application/json` for request bodies; JSON responses.

### `POST /api/auth/register` — public

Request (`UserRegistrationRequestDto`):

```json
{ "email": "user@example.com", "password": "SecureP@ss1", "confirmPassword": "SecureP@ss1" }
```

All three fields are required (Swagger `required: [confirmPassword, email, password]`).

- `email`: `@NotBlank @Email`
- `password`: `@NotBlank @Length(min = 8, max = 32)` + `@StrongPassword`
  (`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])\S{8,32}$`, which also forbids whitespace)
- `confirmPassword`: `@NotBlank @Length(min = 8, max = 32)`, and must equal `password`
  (`@AssertTrue isPasswordsMatch()`, message `"Passwords do not match"`)

Swagger also lists a boolean `passwordsMatch` property. It is the computed `@AssertTrue` getter, not
an input: the frontend does not send it. The email is normalised server-side.

| Status | Body |
|--------|------|
| `201` | `{ "accessToken": "<jwt>" }` + `Set-Cookie: refresh_token_cookie=…` — the user is signed in |
| `400` | `ValidationErrorResponse`; one field can have several messages. Keys: `email`, `password`, `confirmPassword`, and `passwordsMatch` for a mismatch (verified, see below) |
| `409` | `ErrorResponse`, message `"This email is already in use"` (verified) |
| `500` | `ErrorResponse` (also possible on a simultaneous duplicate registration) |

Verified `400` responses (2026-11-18):

| Request | `errors` |
|---------|----------|
| `confirmPassword` omitted | `{ "confirmPassword": ["must not be blank"], "passwordsMatch": ["Passwords do not match"] }` |
| `confirmPassword` differs | `{ "passwordsMatch": ["Passwords do not match"] }` |
| `confirmPassword` empty | `{ "confirmPassword": ["must not be blank", "length must be between 8 and 32"], "passwordsMatch": [...] }` |

#### Frontend registration flow

1. The form has **Email**, **Password** and **Confirm password**, all required. Client-side
   validation runs on blur and on submit: the password must pass the strength rules, and the
   confirmation must not be empty and must match the password ("Passwords do not match.").
   Nothing is sent while a field is invalid.
2. The request body is `{ email (trimmed), password, confirmPassword }`.
3. `201`: the access token is stored in memory and the user is sent to `/`.
4. `409`: an inline error on the email field.
5. `400`: field errors are shown inline. `confirmPassword` and `passwordsMatch` both map to the
   Confirm password field. A `400` with no known field shows a generic form error.

### `POST /api/auth/login` — public

Request (`UserLoginRequestDto`): `{ "email", "password" }` with the **same `email` and `password`
validation** as registration, including `@StrongPassword`. There is no `confirmPassword`.

| Status | Body |
|--------|------|
| `200` | `{ "accessToken": "<jwt>" }` + refresh cookie |
| `400` | `ValidationErrorResponse` — also returned for a password that doesn't match the strength rule |
| `401` | `ErrorResponse`, message `"Wrong email or password"` |
| `500` | `ErrorResponse` |

The frontend shows the same "Incorrect email or password" message for `400` and `401` on login.

### `POST /api/auth/refresh` — public (uses the cookie)

No body. Reads cookie `refresh_token_cookie`.

| Status | Body |
|--------|------|
| `200` | `{ "accessToken": "<jwt>" }` + rotated refresh cookie |
| `401` | cookie missing → Problem Details body `{"detail":"Refresh token is missing","instance":…,"status":401,"title":"Unauthorized"}`; token expired, or revoked-token reuse → `ErrorResponse` `"Revoked refresh token reuse detected"` (verified) |
| `404` | `ErrorResponse`, `"Refresh token was not found"` |

### `POST /api/auth/logout` — public (uses the cookie)

No body. Always clears the cookie (`Max-Age=0`) and revokes the refresh token if one was sent.

| Status | Body |
|--------|------|
| `204` | — |
| `404` | refresh token not found (cookie still cleared) |

The access token stays valid until it expires, so the frontend discards it locally.

### `POST /api/auth/logout-all` — requires Bearer token

Revokes all of the user's refresh tokens. **Not used by the frontend yet.**

### Current user / session lookup

**No such endpoint exists.** The frontend cannot display the signed-in user's email after a reload.

## Error payloads

`ErrorResponse`:

```json
{ "status": 409, "message": "This email is already in use", "timestamp": "2026-11-12T10:00:00Z" }
```

`ValidationErrorResponse` (400 from bean validation):

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": { "password": ["Password must be 8-32 characters long and include uppercase, lowercase, digit, and special character"] },
  "timestamp": "2026-11-12T10:00:00Z"
}
```

Spring Security `401` responses for missing or invalid Bearer tokens have an empty body and a
`WWW-Authenticate: Bearer …` header (verified).
The frontend never displays raw backend messages for these; it maps statuses to English UI text.

## Required backend environment variables (names only)

`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `POSTGRES_DOCKER_PORT`,
`SPRING_LOCAL_PORT`, `SPRING_DOCKER_PORT`, `JWT_SECRET` (Base64-decoded by `SecurityConfig`),
`JWT_EXPIRATION`, `GEMINI_API_KEY`, `REFRESH_TOKEN_EXPIRATION`, `REFRESH_TOKEN_MAX_AMOUNT`,
`REFRESH_TOKEN_MAX_AGE`, `REFRESH_TOKEN_COOKIE_PATH`, `REFRESH_TOKEN_COOKIE_SECURE`,
`MEAL_PHOTOS_DIRECTORY` (optional, default `./uploads`).

## Local backend setup used for verification

The backend `.env` (gitignored, never committed) followed the README, with these local choices:
`POSTGRES_PORT=5434` (5432/5433 were taken by other local PostgreSQL services),
`JWT_EXPIRATION=900000`, a placeholder `GEMINI_API_KEY` (auth doesn't use it),
`REFRESH_TOKEN_EXPIRATION=7d`, `REFRESH_TOKEN_MAX_AGE=30d`, `REFRESH_TOKEN_COOKIE_PATH=/api/auth`,
`REFRESH_TOKEN_COOKIE_SECURE=false`. With these, startup succeeded even though `application.yaml` has the
`{JWT_SECRET}` typo, because the `JWT_SECRET` / `JWT_EXPIRATION` environment variables override it.

## Open questions for the backend developer

1. **CORS** is disabled. A deployed frontend on a different origin needs a CORS configuration that
   allows credentials, or the app has to be served from the same origin as the API.
2. ~~**`application.yaml`** placeholders missing `$`~~ — fixed in `36a9788` (`${JWT_SECRET}`,
   `${JWT_EXPIRATION}`). Still open: `docker-compose.yaml` passes `JWT_ACCESS_TOKEN_EXPIRATION_MS`,
   not `JWT_EXPIRATION`.
3. **Refresh-token durations (confirmed live)** — fixed in the backend README and `.env.example`
   as of `36a9788` (`30d`). `REFRESH_TOKEN_EXPIRATION` and
   `REFRESH_TOKEN_MAX_AGE` bind to `Duration`, so the README's unitless `7` / `30` are read as
   milliseconds. With them, register/login responded with
   `Set-Cookie: refresh_token_cookie=…; Max-Age=0; Expires=Thu, 01 Jan 1970 …`: the browser drops the
   cookie at once, so refresh and session restore can't work. With `7d` / `30d` the cookie comes back with
   `Max-Age=2592000` and refresh works. Please update the README / `.env.example` values.
4. **Cookie path:** with the README's `REFRESH_TOKEN_COOKIE_PATH=/api/auth/refresh`, the browser
   doesn't send the cookie to `/api/auth/logout`, so logout can't revoke it server-side.
   `/api/auth` (as in `.env.example`) covers both endpoints. Fixed in the backend README as of `36a9788`.
5. **Login applies `@StrongPassword`**, so a wrong but differently formatted password returns `400`
   instead of `401`.
6. **No current-user endpoint** (e.g. `GET /users/me`) to show who is signed in.
7. **Multiple tabs:** two tabs refreshing at the same moment can trigger revoked-token reuse
   detection and end all sessions.
