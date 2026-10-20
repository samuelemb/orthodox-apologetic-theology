import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";
export async function createServerSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(values) {
        // Read-only Server Components rely on the auth-route Proxy to refresh cookies.
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Cookie writes are only permitted in Route Handlers / Server Actions. */ }
      },
    },
  });
}
