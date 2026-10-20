export class SupabaseConfigurationError extends Error {
  constructor() { super("Supabase is not configured with a project URL and publishable key."); this.name = "SupabaseConfigurationError"; }
}
/** Called lazily. Importing helpers never makes sample pages require credentials. */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key || !key.startsWith("sb_publishable_")) throw new SupabaseConfigurationError();
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new SupabaseConfigurationError(); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") throw new SupabaseConfigurationError();
  return { url, key };
}
