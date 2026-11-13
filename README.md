# FoodLog Frontend

Web client for FoodLog, a food-tracking and nutrition-logging app. Users create an account,
sign in, and (in upcoming milestones) analyse meal photos with AI, log meals, and track their
daily calorie and macronutrient balance.

The frontend talks to the [FoodLog backend](https://github.com/FoodLog-Team/foodlog-backend)
through its HTTP API. The backend is developed separately; this repository contains only the
user interface.

## Tech Stack

- **React 19** with **TypeScript 6**
- **Vite 8** for the dev server and production builds
- **React Router 7** for client-side routing
- **ESLint** (typescript-eslint, React Hooks, React Refresh rules)
- Plain CSS with design tokens and automatic light/dark themes. There is no UI framework.
- Native `fetch` behind a small typed API client, with no extra HTTP library

## Features

Implemented:

- Email/password **registration** with inline validation that matches the backend's password rules
- **Login** with clear invalid-credential and error messages
- **Session handling** with JWT access tokens and an HttpOnly refresh-token cookie, including
  session restore after a page reload
- **Protected routes**: signed-out users are redirected to the login page
- **Logout**
- A minimal **home page** shell with placeholders for upcoming sections

Planned: nutrition profile and daily targets, meal photo analysis, meal review and saving, daily
dashboard, and meal history.

## Prerequisites

| Tool    | Version                    | Purpose                                     |
|---------|----------------------------|---------------------------------------------|
| Node.js | 20.19+ or 22.12+           | Runtime for Vite and npm (required by Vite 8) |
| npm     | 10+ (bundled with Node.js) | Dependency management and scripts           |
| Git     | Latest stable              | Version control                             |
| Docker  | Latest stable              | Easiest way to run the backend locally      |

Check your versions:

```bash
node -v
npm -v
```

You also need a running FoodLog backend. See [Running the Backend](#1-start-the-backend).

## Getting Started

### Cloning the Repository

```bash
git clone https://github.com/FoodLog-Team/foodlog-frontend.git
cd foodlog-frontend
git switch develop
```

### Installing Dependencies

```bash
npm install
```

Use `npm ci` instead for an exact install from `package-lock.json`, as in CI.

## Environment Variables

The app works with the defaults, so a `.env` file is **optional**. To change a value, copy the
example file and edit it:

```bash
cp .env.example .env
```

| Variable                | Default                 | Description |
|-------------------------|-------------------------|-------------|
| `VITE_API_BASE_URL`     | `/api`                  | Base URL of the backend API, including the backend's `/api` context path. Keep `/api` for local development so requests go through the dev proxy. |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:8080` | Where the Vite dev and preview servers forward `/api` requests. Used only by Vite and never sent to the browser. |

> Variables prefixed with `VITE_` are embedded in the browser bundle at build time. Never put
> secrets in them, and never commit your `.env` file (it is already in `.gitignore`).

## Running the Application Locally

### 1. Start the backend

Follow the [backend README](https://github.com/FoodLog-Team/foodlog-backend#readme). The
quickest route is Docker Compose:

```bash
git clone https://github.com/FoodLog-Team/foodlog-backend.git
cd foodlog-backend
git switch develop
```

Create the backend's `.env` file as described in its README, then start it:

```bash
docker compose up --build -d
```

When it is ready, the API is served at `http://localhost:8080/api` and Swagger UI at
`http://localhost:8080/api/swagger-ui.html`.

When you fill in the backend `.env`, watch for these known issues:

- **Use units for refresh-token durations**, e.g. `REFRESH_TOKEN_EXPIRATION=7d` and
  `REFRESH_TOKEN_MAX_AGE=30d`. Plain numbers (`7`, `30`) are read as milliseconds, so the browser
  discards the session cookie immediately and you are signed out on every reload.
- Set `REFRESH_TOKEN_COOKIE_PATH=/api/auth` so the cookie reaches both `/auth/refresh` and
  `/auth/logout`.
- Set `REFRESH_TOKEN_COOKIE_SECURE=false` for plain-HTTP local development.
- If PostgreSQL already runs on your machine, change `POSTGRES_PORT` (e.g. `5434`) to avoid a
  port conflict.
- `JWT_SECRET` must be a Base64-encoded value, e.g. the output of `openssl rand -base64 32`.

### 2. Start the frontend

From the `foodlog-frontend` directory:

```bash
npm run dev
```

Open the URL Vite prints, by default `http://localhost:5173`. You will land on the login page.
Create an account on the **Create an account** page to sign in.

### How the frontend reaches the backend

The backend currently has **CORS disabled**, so the browser cannot call `localhost:8080`
directly. Instead, the browser sends API requests to the Vite server under `/api`, and Vite
forwards them to the backend (see `vite.config.ts`):

```
Browser ──► http://localhost:5173/api/... ──(Vite proxy)──► http://localhost:8080/api/...
```

Because the browser only ever talks to one origin, the backend's HttpOnly refresh-token cookie
works without any CORS configuration. The proxy is active for both `npm run dev` and
`npm run preview`.

### Stopping

Stop the frontend with `Ctrl+C`. Stop the backend from the `foodlog-backend` directory:

```bash
docker compose down
```

## Available Scripts

| Command           | Description |
|-------------------|-------------|
| `npm run dev`     | Start the Vite dev server with hot module replacement |
| `npm run build`   | Type-check (`tsc -b`) and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally (also proxies `/api`) |
| `npm run lint`    | Run ESLint on the whole project |

Before opening a pull request, make sure `npm run lint` and `npm run build` both pass.

## Project Structure

```
├── docs/
│   └── auth-api-integration.md   # Verified backend auth contract and open backend questions
├── public/                       # Static assets served as-is (favicon)
├── src/
│   ├── app/
│   │   ├── App.tsx               # Providers and route table
│   │   └── routes/               # Route guards (protected / public-only)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/              # Typed auth endpoints (register, login, refresh, logout)
│   │   │   ├── components/       # Auth layout, password field
│   │   │   ├── lib/              # Session store, auth context, validation rules
│   │   │   ├── pages/            # Login and registration pages
│   │   │   └── AuthProvider.tsx  # Session state for the whole app
│   │   └── home/
│   │       └── pages/            # Authenticated home page
│   ├── shared/
│   │   ├── api/                  # HTTP client and normalised API errors
│   │   └── components/           # Reusable UI (text field, alert, logo)
│   ├── index.css                 # Global styles and design tokens
│   ├── main.tsx                  # Application entry point
│   └── vite-env.d.ts             # Types for VITE_* environment variables
├── .env.example                  # Documented environment variables
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts                # Vite config, including the /api dev proxy
```

New product areas (profile, meals, dashboard, history) go in their own folder under
`src/features/`. Code used by several features goes in `src/shared/`.

## Backend Integration

- All HTTP calls go through the typed client in `src/shared/api/httpClient.ts`. Components never
  call `fetch` directly; each feature exposes its endpoints from its own `api/` folder.
- Request and response types mirror the backend DTOs. Only use endpoints, fields and enum values
  that exist in the backend, and verify them in the backend source or Swagger UI before relying
  on them.
- The verified authentication contract (routes, payloads, status codes, error formats) is in
  [docs/auth-api-integration.md](docs/auth-api-integration.md). Add to it when you integrate a
  new endpoint.
- The backend repository is owned by another team member. Don't modify backend code. Report
  missing endpoints or contract issues to the backend developer.

### Authentication and session

| Piece | How it works |
|-------|--------------|
| Access token | JWT returned in the JSON body of register/login/refresh. Kept **in memory only** (never in `localStorage`) and sent as `Authorization: Bearer <token>`. |
| Refresh token | Opaque token in the HttpOnly cookie `refresh_token_cookie`, set by the backend. JavaScript cannot read it. |
| Page reload | The app calls `POST /api/auth/refresh` once on startup to restore the session. |
| Expired access token | An authenticated request that gets `401` triggers one refresh and a retry. If that fails, the user is signed out. |
| Logout | `POST /api/auth/logout` revokes the refresh token and clears the cookie. |

The backend rotates the refresh token on every refresh and treats reuse of an old token as a
security event that ends **all** of the user's sessions. The client therefore shares a single
in-flight refresh request. Keep that behaviour when changing session code.

## Building for Production

```bash
npm run build
```

The static output in `dist/` can be served by any static host. Keep in mind:

- Set `VITE_API_BASE_URL` at build time to wherever the API is reachable.
- Because the backend has CORS disabled, the deployed frontend must either be served from the
  **same origin** as the API (e.g. a reverse proxy that routes `/api` to the backend), or the
  backend must add a CORS configuration that allows credentials.
- Configure the host to serve `index.html` for unknown paths, so client-side routes like
  `/login` work on refresh.

## Git Workflow

| Branch | Purpose |
|--------|---------|
| `main` | Stable branch |
| `develop` | Shared development branch, and the target for all feature PRs |
| `feature/*`, `fix/*`, `docs/*` | Short-lived branches for individual tasks |

1. Update your local `develop`: `git switch develop && git pull`.
2. Create a branch from it, e.g. `git switch -c feature/meal-upload`.
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat(auth): …`, `fix(login): …`, `docs(readme): …`).
4. Push and open a pull request **into `develop`**. Check the base branch before creating the PR.
5. Don't commit directly to `main` or `develop`.

## Troubleshooting

**"We couldn't reach FoodLog" screen, or "Something went wrong" on login.**
The backend isn't running or isn't reachable at `VITE_DEV_PROXY_TARGET`. Check that
`http://localhost:8080/api/swagger-ui.html` opens, and run `docker compose ps` in the backend
folder.

**Signed out after every page reload.**
The refresh-token cookie is being discarded. Check the backend `.env` values for
`REFRESH_TOKEN_MAX_AGE` / `REFRESH_TOKEN_EXPIRATION` (they need units such as `30d` / `7d`) and
`REFRESH_TOKEN_COOKIE_PATH=/api/auth`, then restart the backend.

**Port 5173 is already in use.**
Another Vite server is running. Stop it, or start this one on another port with
`npm run dev -- --port 5174`.

**`localhost:5173` doesn't load but the dev server is running.**
On some Windows setups Vite listens on IPv4 only. Open `http://127.0.0.1:5173` instead.

**CORS errors in the browser console.**
The app is calling the backend directly instead of through the proxy. Make sure
`VITE_API_BASE_URL` is `/api` (the default) and restart `npm run dev` after changing `.env`.

## Related Documentation

- [Backend repository and README](https://github.com/FoodLog-Team/foodlog-backend)
- [Auth API integration notes](docs/auth-api-integration.md)
- [Vite](https://vite.dev/) · [React](https://react.dev/) · [React Router](https://reactrouter.com/)
