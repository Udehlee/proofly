import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { db } from "./db.ts";


export function isGuestEmail(email?: string | null): boolean {
  if (!email || !email.trim()) return true;
  return email.trim().toLowerCase().endsWith("@guest.proofly.local");
}

// Returns a stable unique database email for guest sessions or registered users.
export function getDbEmail(user: { id: string; email?: string | null }): string {
  const trimmed = user.email?.trim();
  if (!trimmed || isGuestEmail(trimmed)) {
    return `${user.id}@guest.proofly.local`;
  }
  return trimmed;
}

/**
 * Syncs a Supabase auth user to our User table, creating a guest record (@guest.proofly.local) if needed.
 * Keeps existing real emails on refresh and recovers from concurrent-create (P2002) collisions.
 */
export async function syncUserRecord(
  user: SupabaseUser | { id: string; email?: string | null; user_metadata?: { full_name?: string | null } },
  dbClient: any = db
) {
  const userModel = dbClient.user ?? dbClient;
  const existing = await userModel.findUnique({ where: { id: user.id } });

  const rawIncomingEmail = user.email?.trim();
  const isIncomingGuest = !rawIncomingEmail || isGuestEmail(rawIncomingEmail);

  let targetEmail: string;

  if (existing) {
    const existingEmail = existing.email?.trim();
    const isExistingGuest = !existingEmail || isGuestEmail(existingEmail);

    if (isIncomingGuest) {
      if (isExistingGuest) {
        targetEmail = existingEmail || `${user.id}@guest.proofly.local`;
      } else {
        targetEmail = existingEmail;
      }
    } else {
      targetEmail = rawIncomingEmail;
    }

    if (existing.email === targetEmail) {
      return existing;
    }

    return userModel.update({
      where: { id: user.id },
      data: { email: targetEmail },
    });
  }

  targetEmail = isIncomingGuest ? `${user.id}@guest.proofly.local` : rawIncomingEmail!;
  const name = (user as any).user_metadata?.full_name ?? null;

  try {
    return await userModel.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: targetEmail,
        ...(name ? { name } : {}),
      },
      update: {
        email: targetEmail,
      },
    });
  } catch (err: unknown) {
    const pError = err as { code?: string; meta?: { target?: string[] }; message?: string };
    if (pError?.code === "P2002") {
      const isIdTarget =
        pError.meta?.target?.includes("id") ||
        Boolean(pError.message?.includes("User_pkey"));
      if (isIdTarget) {
        const found = await userModel.findUnique({ where: { id: user.id } });
        if (found) return found;
      }
    }
    throw err;
  }
}

//Moves a guest's documents and evaluations to the real user account
//then deletes the guest.
export async function claimGuestWork(
  guestId: string,
  targetUserId: string,
  tx: any = db
) {
  if (guestId === targetUserId) {
    return { transferred: false };
  }

  if (typeof tx.$transaction === "function") {
    const docOp = tx.document.updateMany({
      where: { userId: guestId },
      data: { userId: targetUserId },
    });
    const evalOp = tx.evaluation.updateMany({
      where: { userId: guestId },
      data: { userId: targetUserId },
    });
    const userOp = tx.user.deleteMany({
      where: { id: guestId },
    });
    await tx.$transaction([docOp, evalOp, userOp]);
  } else {
    await tx.document.updateMany({
      where: { userId: guestId },
      data: { userId: targetUserId },
    });
    await tx.evaluation.updateMany({
      where: { userId: guestId },
      data: { userId: targetUserId },
    });
    await tx.user.deleteMany({
      where: { id: guestId },
    });
  }

  return { transferred: true };
}

export async function cleanupExpiredGuestWork(
  dbClient: any = db,
  maxAgeHours = 48
): Promise<{ cleanedCount: number }> {
  const client = dbClient.user ?? dbClient;
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  const expiredGuests = await client.findMany({
    where: {
      email: { endsWith: "@guest.proofly.local" },
      createdAt: { lt: cutoff },
    },
    select: { id: true },
  });

  if (!expiredGuests || expiredGuests.length === 0) {
    return { cleanedCount: 0 };
  }

  const ids = expiredGuests.map((u: { id: string }) => u.id);
  const result = await client.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  return { cleanedCount: result.count ?? ids.length };
}
