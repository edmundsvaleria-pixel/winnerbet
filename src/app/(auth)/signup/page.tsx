"use client";

import { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { AlertCircle, Eye, Loader2, MailCheck, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Currency = { code: string; symbol: string; label: string };

const CURRENCY_BY_DIAL: Record<string, Currency> = {
  "+233": { code: "GHS", symbol: "GH₵", label: "Ghana Cedi" },
  "+234": { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  "+254": { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
  "+27": { code: "ZAR", symbol: "R", label: "South African Rand" },
  "+1": { code: "USD", symbol: "$", label: "US Dollar" },
  "+44": { code: "GBP", symbol: "£", label: "Pound Sterling" },
};

const DEFAULT_CURRENCY: Currency = CURRENCY_BY_DIAL["+233"];
const DIAL_KEYS = Object.keys(CURRENCY_BY_DIAL).sort((a, b) => b.length - a.length);

function detectCurrency(phone: string): Currency {
  if (!phone) return DEFAULT_CURRENCY;
  for (const dial of DIAL_KEYS) {
    if (phone.startsWith(dial)) return CURRENCY_BY_DIAL[dial];
  }
  return DEFAULT_CURRENCY;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const currency = useMemo(() => detectCurrency(phone), [phone]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: username.trim().toLowerCase(),
            phone,
            currency: currency.code,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) throw signUpError;

      // Capture Referral
      if (data.user && refCode) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", refCode.toLowerCase())
          .single();

        if (referrer) {
          await supabase.from("referrals").insert({
            referrer_id: referrer.id,
            referred_id: data.user.id,
            status: "pending"
          });
        }
      }

      if (data.session) {
        router.replace("/sports/football");
        router.refresh();
      } else {
        setNeedsEmailConfirm(true);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (needsEmailConfirm) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-wb-bg px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-wb-border bg-wb-surface p-8 text-center">
          <MailCheck className="h-10 w-10 text-wb-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">Confirm your email</h1>
          <p className="mt-2 text-sm text-wb-muted">Check your inbox for the activation link.</p>
          <Link href="/login" className="mt-6 block w-full rounded-xl bg-wb-primary py-3 text-sm font-bold text-black">Go to Login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-wb-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-wb-primary" />
          <span className="text-2xl font-extrabold text-white">Winner<span className="text-wb-primary">bet</span></span>
        </div>
        <div className="rounded-2xl border border-wb-border bg-wb-surface p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white">Create account</h1>
          {refCode && <p className="text-xs text-wb-primary mt-1">Referred by {refCode}</p>}
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" required />
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" required />
            <PhoneInput defaultCountry="gh" value={phone} onChange={setPhone} />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wb-muted"><Eye className="h-4 w-4" /></button>
            </div>
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" required />

            {error && <div className="flex gap-2 text-xs text-wb-danger"><AlertCircle className="h-4 w-4" /> {error}</div>}

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-wb-primary py-3 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create Account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-wb-muted">Have an account? <Link href="/login" className="text-wb-primary font-bold">Log in</Link></p>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return <Suspense fallback={<div className="flex h-screen items-center justify-center bg-wb-bg"><Loader2 className="h-8 w-8 animate-spin text-wb-primary" /></div>}><SignupForm /></Suspense>;
}