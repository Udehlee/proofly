import Link from "next/link";
import AuthForm from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="shell min-h-[calc(100vh-70px)] grid place-items-center">
      <div>
        <AuthForm mode="signup" />
        <p className="text-center text-[var(--muted)] text-sm mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--accent)] font-semibold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
