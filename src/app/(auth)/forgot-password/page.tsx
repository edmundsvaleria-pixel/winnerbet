"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, MailCheck, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "new_password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setStep("otp");
      else setError(data.error);
    } catch { setError("Failed to send code."); } 
    finally { setLoading(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      // Check if OTP matches and is not expired
      const { data: profile } = await supabase.from("profiles").select("reset_token, reset_token_expires").eq("email", email).single();
      
      if (!profile || profile.reset_token !== otp) {
        setError("Invalid code.");
        return;
      }
      if (new Date(profile.reset_token_expires) < new Date()) {
        setError("Code has expired. Request a new one.");
        return;
      }
      setStep("new_password");
    } catch { setError("Verification failed."); } 
    finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true); setError(null);
    try {
      // Update password via Supabase auth admin API (requires service role, so we use a route or standard update)
      // Since we are logged out, we must use the reset password link OR update via admin route.
      // For this flow, we will ask them to log in with the new password, but we need to update it in auth.users.
      
      // Note: To actually change the password without a magic link, you need a backend admin route. 
      // For simplicity, let's redirect them to login and tell them to use the code as password (or implement admin update).
      // Actually, Supabase requires a session to update the password. 
      // The safest way without a magic link is to use a secure API route with service role.
      
      const res = await fetch("/api/auth/update-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      if (res.ok) {
        alert("Password reset successful! Please log in.");
        router.push("/login");
      } else {
        setError("Failed to reset password.");
      }
    } catch { setError("Something went wrong."); } 
    finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-wb-bg px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wb-primary text-black font-black text-xl">W</div>
          <span className="text-2xl font-extrabold tracking-tight text-white">Rigged<span className="text-wb-primary">Win</span></span>
        </div>

        <div className="rounded-2xl border border-wb-border bg-wb-surface p-6 sm:p-8">
          {step === "email" && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Reset Password</h1>
              <p className="text-sm text-wb-muted mb-6">Enter your email to receive an 8-digit code.</p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" />
                {error && <p className="text-xs text-wb-danger">{error}</p>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Code"}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Enter Code</h1>
              <p className="text-sm text-wb-muted mb-6">We sent an 8-digit code to {email}.</p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="8-digit code" maxLength={8} required className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-center tracking-widest text-lg font-bold text-white focus:border-wb-primary focus:outline-none" />
                {error && <p className="text-xs text-wb-danger">{error}</p>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
                </button>
              </form>
            </>
          )}

          {step === "new_password" && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">New Password</h1>
              <p className="text-sm text-wb-muted mb-6">Enter your new password.</p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" />
                {error && <p className="text-xs text-wb-danger">{error}</p>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}