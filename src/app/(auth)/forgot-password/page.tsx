"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, MailCheck, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-wb-bg px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-wb-border bg-wb-surface p-8 text-center animate-fade-up">
          <MailCheck className="h-12 w-12 text-wb-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-sm text-wb-muted mb-6">
            We sent a password reset link to <span className="text-white font-medium">{email}</span>.
          </p>
          <Link href="/login" className="w-full flex justify-center rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover">
            Back to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-wb-bg px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wb-primary text-black font-black text-xl">
            W
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Rigged<span className="text-wb-primary">Win</span>
          </span>
        </div>

        <div className="rounded-2xl border border-wb-border bg-wb-surface p-6 sm:p-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-wb-muted hover:text-white mb-6 transition">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>

          <h1 className="text-xl font-bold text-white">Reset Password</h1>
          <p className="mt-1 text-sm text-wb-muted mb-6">
            Enter your email address and we will send you a link to reset your password.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-wb-muted mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                required
                className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none focus:ring-1 focus:ring-wb-primary"
              />
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}