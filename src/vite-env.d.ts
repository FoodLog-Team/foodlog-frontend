/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API, including its `/api` context path. Defaults to `/api`. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
