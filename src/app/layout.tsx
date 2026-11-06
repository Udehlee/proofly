import "./globals.css";
import type { Metadata } from "next";
import SiteHeader from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Proofly",
  description: "Verify. Evaluate. Build Trust. Evidence-grounded AI answers for your business documents.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
