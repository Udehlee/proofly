"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardNav({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isGuest = email.endsWith("@guest.proofly.local");
  const displayEmail = isGuest ? "Guest User" : email;

  return (
    <nav
      aria-label="Dashboard navigation"
      className="border-b border-[var(--line)] bg-white"
    >
      <div className="shell min-h-12 flex items-center justify-between gap-5">
        <div className="flex gap-5 text-sm">
          <Link href="/dashboard/documents" className="font-medium hover:text-[var(--accent)] transition-colors">
            Documents
          </Link>
          <Link href="/dashboard/evaluations" className="font-medium hover:text-[var(--accent)] transition-colors">
            Evaluations
          </Link>
          <Link href="/dashboard/evaluations/new" className="font-medium hover:text-[var(--accent)] transition-colors">
            New evaluation
          </Link>
        </div>
        <div className="flex items-center gap-3 text-[13px]">
          <span className="muted text-[var(--muted)]">{displayEmail}</span>
          {isGuest ? (
            <Link
              href="/signup"
              className="btn px-3 py-1 text-xs no-underline"
            >
              Claim Account
            </Link>
          ) : (
            <button
              className="btn secondary px-3 py-1 text-xs"
              onClick={logout}
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
