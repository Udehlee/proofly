import { redirect } from "next/navigation";
import { ensureDbUser} from "@/server/auth";
import DashboardNav from "@/components/layout/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await ensureDbUser();
  } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
    redirect("/login");
  }
    
    throw error;
  }
  if (!user?.email) redirect("/login");

  return (
    <>
      <DashboardNav email={user.email} />
      {children}
    </>
  );
}
