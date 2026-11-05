import "server-only";

import { cache } from "react";

import { HttpError } from "@/lib/error";
import { createClient } from "@/lib/supabase/server";
import { AuthenticationError } from "./errors.ts";
import { syncUserRecord } from "./guest-user.ts";

export { AuthenticationError };

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return data.user;
});

export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }

  return user;
});

export const ensureDbUser = cache(async () => {
  const user = await requireUser();
  return syncUserRecord(user);
});
