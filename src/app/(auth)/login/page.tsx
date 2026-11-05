import AuthForm from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="shell min-h-[calc(100vh-70px)] grid place-items-center">
      <div>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
