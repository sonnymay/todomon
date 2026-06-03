/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_REVENUECAT_IOS_API_KEY?: string
  // 'false' = real Supabase auth; anything else (or unset) = offline/local mode.
  readonly VITE_OFFLINE_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
