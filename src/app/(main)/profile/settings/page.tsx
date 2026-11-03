"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState("");
  const [selfExcluded, setSelfExcluded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("daily_deposit_limit, self_excluded_until").eq("id", user.id).single();
      
      if (data) {
        setLimit(data.daily_deposit_limit ? String(data.daily_deposit_limit) : "");
        if (data.self_excluded_until && new Date(data.self_excluded_until) > new Date()) {
          setSelfExcluded(true);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function updateLimit() {
    setMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({ daily_deposit_limit: Number(limit) }).eq("id", user.id);
    setMessage("Daily deposit limit updated.");
  }

  async function toggleSelfExclusion() {
    if (!confirm("Are you sure? You will not be able to log in or bet for 6 months.")) return;
    setMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const excludeUntil = new Date();
    excludeUntil.setMonth(excludeUntil.getMonth() + 6);

    await supabase.from("profiles").update({ self_excluded_until: excludeUntil.toISOString() }).eq("id", user.id);
    
    // Log the user out immediately
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Responsible Gambling</h1>

      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-wb-primary/10 p-3 text-sm text-wb-primary">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-2xl border border-wb-border bg-wb-surface p-5">
          <h2 className="text-sm font-bold text-white mb-1">Daily Deposit Limit</h2>
          <p className="text-xs text-wb-muted mb-3">Set a limit on how much you can deposit per day (0 = No limit).</p>
          <div className="flex gap-2">
            <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="e.g. 500" className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2 text-sm text-white focus:border-wb-primary focus:outline-none" />
            <button onClick={updateLimit} className="rounded-xl bg-wb-primary px-4 py-2 text-sm font-bold text-black hover:bg-wb-primary-hover transition">Save</button>
          </div>
        </div>

        <div className="rounded-2xl border border-wb-danger/30 bg-wb-danger/5 p-5">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-5 w-5 text-wb-danger" />
            <h2 className="text-sm font-bold text-wb-danger">Self-Exclusion</h2>
          </div>
          <p className="text-xs text-wb-muted mb-3">Take a break. Self-exclusion prevents you from logging in, depositing, or betting for 6 months.</p>
          <button onClick={toggleSelfExclusion} className="rounded-xl bg-wb-danger px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition w-full">
            Self-Exclude for 6 Months
          </button>
        </div>
      </div>
    </div>
  );
}