"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Copy, Users, CheckCircle2, Loader2 } from "lucide-react";

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (profile) setReferralCode(profile.username.toUpperCase());
      
      const { data: refs } = await supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
      if (refs) setReferrals(refs);
      setLoading(false);
    }
    load();
  }, []);

  function copyLink() {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-wb-primary" />
        <h1 className="text-xl font-bold text-white">Refer & Earn</h1>
      </div>
      <div className="rounded-2xl border border-wb-border bg-wb-surface p-5 mb-6">
        <p className="text-sm text-wb-muted mb-3">Invite a friend. When they deposit, you earn <span className="text-wb-primary font-bold">GH₵ 20</span>.</p>
        <div className="flex gap-2">
          <input type="text" readOnly value={`${window.location.origin}/signup?ref=${referralCode}`} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white" />
          <button onClick={copyLink} className="rounded-xl bg-wb-primary px-4 py-3 text-sm font-bold text-black hover:bg-wb-primary-hover transition">
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <h2 className="text-sm font-bold text-white mb-3">Your Referrals</h2>
      {referrals.length === 0 ? (
        <p className="text-center py-6 text-wb-muted text-sm border border-wb-border rounded-xl bg-wb-surface">No referrals yet.</p>
      ) : (
        <div className="space-y-2">
          {referrals.map((ref) => (
            <div key={ref.id} className="flex items-center justify-between rounded-xl border border-wb-border bg-wb-surface p-4">
              <p className="text-sm text-white">Referral #{ref.id}</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${ref.commission_paid ? 'bg-wb-primary/10 text-wb-primary' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {ref.commission_paid ? "Paid (GH₵ 20)" : "Pending Deposit"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
