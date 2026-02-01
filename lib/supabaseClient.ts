import { createBrowserClient } from '@supabase/ssr'

export function getSupabaseClient() {
  // Let @supabase/ssr handle cookies automatically
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}