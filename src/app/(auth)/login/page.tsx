"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const id = identifier.trim();
    if (!id) return setError("Enter your email or username.");
    if (!password) return setError("Enter your password.");

    setLoading(true);

    try {
      let email = id;

      // Username path — resolve to email server-side
      if (!id.includes("@")) {
        const { data, error: rpcError } = await supabase.rpc("get_email_for_username", {
          p_username: id,
        });

        if (rpcError) {
          setError("Could not look up that username. Please try again.");
          return;
        }
        if (!data) {
          setError("No account found with that username.");
          return;
        }
        email = data as string;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes("invalid login")) {
          setError("Incorrect email/username or password.");
        } else if (msg.includes("email not confirmed")) {
          setError("Please confirm your email address before logging in.");
        } else {
          setError(authError.message);
        }
        return;
      }

      const userId = authData.user?.id;

      let role = "member";
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (profile?.role) role = profile.role as string;
      }

      router.replace(role === "admin" ? "/admin" : "/sports/football");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-wb-bg px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wb-primary">
            <Trophy className="h-5 w-5 text-black" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Winner<span className="text-wb-primary">bet</span>
          </span>
        </div>

        <div className="rounded-2xl border border-wb-border bg-wb-surface p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-wb-muted">
            Log in with your email address or username.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-wb-muted"
              >
                Email or Username
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none focus:ring-1 focus:ring-wb-primary"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wide text-wb-muted"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-wb-primary hover:text-wb-primary-hover"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 pr-12 text-sm text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none focus:ring-1 focus:ring-wb-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wb-muted transition hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-wb-danger/40 bg-wb-danger/10 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-wb-danger" />
                <p className="text-sm text-wb-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-wb-primary px-4 py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-wb-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-wb-primary hover:text-wb-primary-hover"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
