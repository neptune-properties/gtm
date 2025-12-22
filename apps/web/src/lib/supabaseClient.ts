import { createClient } from "@supabase/supabase-js"

// Factory for browser-side client
export const supabaseBrowser = (rememberMe: boolean = true) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(url, anon, {
    auth: {
      persistSession: true,
      storage: rememberMe ? localStorage : sessionStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export function createUserSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export const supabaseServer = () => { //added?! bc RLS blocking
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
