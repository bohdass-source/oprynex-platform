import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createDemoClient } from "@/lib/demo-client";

// Public project values from the environment (see .env.example). The publishable key only allows what row level
// security permits for the signed-in member, so it is safe in the browser.
export const SUPABASE_URL: string = import.meta.env["VITE_SUPABASE_URL"] ?? "https://your-project-ref.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY: string = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "sb_publishable_your-key";
/** VITE_DEMO=1 runs the CRM on invented in-memory data, without a database or sign-in (src/lib/demo-client.ts). */
export const DEMO_MODE: boolean = import.meta.env["VITE_DEMO"] === "1";

let client: SupabaseClient | undefined;

/** Browser-only client; the session lives in the browser, so it is never created during server rendering. */
export function supabase(): SupabaseClient {
  if (typeof window === "undefined") throw new Error("supabase() is browser-only");
  if (DEMO_MODE) return (client ??= createDemoClient() as unknown as SupabaseClient);
  client ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
