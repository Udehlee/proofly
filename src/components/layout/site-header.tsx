import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { isGuestEmail } from "@/server/guest-user";
import HeaderActions from "./header-actions";

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const displayEmail =
    user?.email && !isGuestEmail(user.email) ? user.email : null;

  return (
    <header className="site-header sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[var(--line)]">
      <div className="shell bar h-[70px] flex items-center gap-4">
        <Link
          href="/"
          className="brand flex items-center gap-[10px] no-underline"
        >
          <span className=" font-bold text-[25px] text-[#0f172a] tracking-[-0.5px]">
           Proofly
          </span>
        </Link>
       
        <HeaderActions email={displayEmail} />
      </div>
    </header>
  );
}
