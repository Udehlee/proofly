"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { transferGuestWork, saveGuestSession } from "@/lib/guest";
import { useRouter } from "next/navigation";

export default function AuthForm({
  mode: initialMode = "login",
  onSuccess,
  onClose,
  title,
  subtitle,
}: {
  mode?: "login" | "signup";
  onSuccess?: (userEmail: string) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [currentMode, setCurrentMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await saveGuestSession();

      const result =
        currentMode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password, options: { data: { name } } });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (currentMode === "signup" && !result.data.session) {
        setError(
          "Account created. Check your email to confirm your account.Your work from this session will be added when you log in."
        );
        return;
      }

      await transferGuestWork();

      if (onSuccess) {
        onSuccess(email);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const headingText =
    title ||
    (currentMode === "login" ? "Welcome back" : "Create your account");

  const subText =
    subtitle ||
    (currentMode === "login"
      ? "Sign in to save your answers and access them anytime"
      : "Save your documents and evaluations to come back to them anytime");

  return (
    <form
      onSubmit={submit}
      className="card w-full max-w-[440px] relative bg-white shadow-[0_20px_60px_rgba(15,27,45,0.2)] rounded-2xl p-[22px]"
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-lg text-[#64748b] cursor-pointer p-1 leading-none hover:text-[#0f172a]"
          aria-label="Close"
        >
          ✕
        </button>
      )}

      <h2 className="mt-0 text-[22px] font-bold text-[#0f172a]">
        {headingText}
      </h2>
      <p className="muted text-sm mt-1 text-[var(--muted)]">
        {subText}
      </p>

      {currentMode === "signup" && (
        <div className="mt-[18px]">
          <label className="label">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
      )}

      <div className="mt-4">
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
        />
      </div>

      <div className="mt-3.5">
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      {error && (
        <p
          className={`text-[13px] mt-3 ${
            error.startsWith("Account created") ? "text-[#047857]" : "text-[#c0392b]"
          }`}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn w-full mt-5 bg-[#047857] border-[#047857] p-3 font-semibold hover:bg-[#065f46] text-white disabled:opacity-55 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading
          ? "Please wait..."
          : currentMode === "login"
          ? "Sign In & Save Work"
          : "Create Account & Save Work"}
      </button>

      <div className="mt-3.5 text-center">
        {currentMode === "signup" ? (
          <button
            type="button"
            onClick={() => setCurrentMode("login")}
            className="bg-transparent border-none text-[#047857] text-[13px] font-semibold cursor-pointer hover:underline"
          >
            Already have an account? Sign in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentMode("signup")}
            className="bg-transparent border-none text-[#047857] text-[13px] font-semibold cursor-pointer hover:underline"
          >
            Need an account? Create one
          </button>
        )}
      </div>
    </form>
  );
}
