// import { createClient } from "@supabase/supabase-js";

// export const supabaseBrowser = () => {
//   const url = process.env.local.NEXT_PUBLIC_SUPABASE_URL!;
//   const anon = process.env.local.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
//   return createClient(url, anon);
// };

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
