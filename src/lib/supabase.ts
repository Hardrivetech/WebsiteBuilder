import { createClient } from "@supabase/supabase-js";

// Use Vite-exposed env vars in the browser bundle
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
