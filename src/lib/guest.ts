import { createClient } from "@/lib/supabase/client";
import { createClient as createPlainClient } from "@supabase/supabase-js";

const KEY = "proofly_guest";

let guestInitPromise: Promise<unknown> | null = null;

// Ensures a guest session exists without multiple concurrent sign-in calls
export async function ensureGuestSession() {
  const supabase = createClient();
  const {data: { session }} = await supabase.auth.getSession();
  if (session) {
    return session;
  }

  if (!guestInitPromise) { guestInitPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.warn("Guest session init error:", error);
          return null;
        }
        return data.session;
      } catch (err) {
        console.warn("Guest session init exception:", err);
        return null;
      } finally {
        guestInitPromise = null;
      }
    })();
  }

  return guestInitPromise;
}

// Call BEFORE signing up or logging in: remembers the current guest session.
export async function saveGuestSession() {
  const { data } = await createClient().auth.getSession();
  const session = data.session;
  if (session?.user?.is_anonymous) {
    localStorage.setItem(
      KEY,
      JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token })
    );
  }
}

//moves the guest's documents and results into the account
export async function transferGuestWork() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    const temp = createPlainClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data, error } = await temp.auth.setSession(saved);
    if (error || !data.session) {
      localStorage.removeItem(KEY);
      return;
    }
    const res = await fetch("/api/claim-guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestToken: data.session.access_token }),
    });
    if (res.ok) localStorage.removeItem(KEY);
  } catch(error) {
    console.log(error)
  }
}