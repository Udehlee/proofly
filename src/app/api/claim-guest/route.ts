import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { HttpError } from "@/lib/error";
import { getCurrentUser, ensureDbUser } from "@/server/auth";
import { claimGuestWork } from "@/server/guest-user";

export const runtime = "nodejs";

// Transfers guest documents and evaluations to a signed-in user account
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.is_anonymous) {
      throw new HttpError(401, "Please log in first");
    }

    const user = await ensureDbUser();

    const { guestToken } = await request.json();
    if (typeof guestToken !== "string" || !guestToken) {
      throw new HttpError(400, "Guest token is required.");
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const { data, error } = await supabase.auth.getUser(guestToken);
    if (error || !data.user || !data.user.is_anonymous) {
      throw new HttpError(400, "Invalid guest session.");
    }

    await claimGuestWork(data.user.id, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("[api/claim-guest] POST error:", error);
    return NextResponse.json(
      { error: "Could not transfer your work." },
      { status: 500 }
    );
  }
}
