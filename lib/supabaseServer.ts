import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Session-aware client for server components and route handlers.
// Respects RLS: only works for a signed-in HR user.
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list) {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* called from a server component; middleware refreshes instead */ }
        },
      },
    }
  );
}

// Service-role client. Bypasses RLS. Server side only.
// Used solely by the public share endpoint after token validation.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
