"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HeaderActions({email}: {email: string | null}) {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!email) {
    return (
      <div className="bar-actions ml-auto flex items-center gap-2.5">
        <Link
          className="btn secondary px-4 py-[7px] rounded-lg text-[13px] 
          font-medium text-[#0f172a] border-[#cbd5e1] bg-white hover:bg-[#f8fafc]"
          href="/login"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bar-actions ml-auto flex items-center gap-2.5">
      <Link
        className="btn secondary px-4 py-[7px] rounded-lg text-[13px] 
        font-medium text-[#0f172a] border-[#cbd5e1] bg-white hover:bg-[#f8fafc]"
        href="/dashboard"
      >
        Dashboard
      </Link>
      <button
        type="button"
        className="btn secondary px-4 py-[7px] rounded-lg text-[13px] 
        font-medium text-[#0f172a] border-[#cbd5e1] bg-white hover:bg-[#f8fafc]"
        onClick={logout}
      >
        Log out
      </button>
    </div>
  );
}