import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env (copy from .env.example).',
  )
}

// Browser-safe client: uses the public anon/publishable key only.
// Never expose the service-role key in frontend code.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
