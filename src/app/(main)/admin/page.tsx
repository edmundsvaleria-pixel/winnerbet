"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { Loader2, PlusCircle, CheckCircle, XCircle, FileText, Banknote } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const symbol = useUserStore((s) => s.symbol);
  
  const [activeTab, setActiveTab] = useState<"create" | "manage" | "kyc" | "withdrawals">("create");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- CREATE MATCH STATE ---
  const [league, setLeague] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [startTime, setStartTime] = useState("");
  const [homeOdds, setHomeOdds] = useState("2.00");
  const [drawOdds, setDrawOdds] = useState("3.00");
  const [awayOdds, setAwayOdds] = useState("3.50");
  const [result, setResult] = useState(""); // New Result field

  // --- FETCHED DATA STATE ---
  const [pendingBets, setPendingBets] = useState<any[]>([]);
  const [kycList, setKycList] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (data?.role !== "admin") router.push("/sports/football");
    }
    checkAdmin();
  }, [router]);

  const loadPendingBets = async () => {
    const { data } = await supabase.from("bets").select("*").eq("status", "pending").order("created_at", { ascending: false });
    if (data) setPendingBets(data);
  };

  const loadKycRequests = async () => {
    const { data } = await supabase.from("kyc_submissions").select("*").eq("status", "pending");
    if (data) setKycList(data);
  };

  const loadWithdrawals = async () => {
    const { data } = await supabase.from("withdrawal_requests").select("*").eq("status", "pending_admin").order("created_at", { ascending: false });
    if (data) setWithdrawals(data);
  };

  useEffect(() => {
    if (activeTab === "manage") loadPendingBets();
    if (activeTab === "kyc") loadKycRequests();
    if (activeTab === "withdrawals") loadWithdrawals();
  }, [activeTab]);

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/create-match", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          league, homeTeam, awayTeam, startTime, 
          homeOdds: Number(homeOdds), drawOdds: Number(drawOdds), awayOdds: Number(awayOdds),
          result 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Match created successfully!" });
        setLeague(""); setHomeTeam(""); setAwayTeam(""); setStartTime(""); setResult("");
      } else throw new Error(data.error);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSettle(betId: number, outcome: "won" | "lost") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settle-bet", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ betId, outcome }),
      });
      if (res.ok) { setMessage({ type: "success", text: `Bet marked as ${outcome}.` }); loadPendingBets(); }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleKycAction(userId: string, submissionId: number, action: "approved" | "rejected") {
    setLoading(true);
    await supabase.from("kyc_submissions").update({ status: action }).eq("id", submissionId);
    await supabase.from("profiles").update({ kyc_status: action }).eq("id", userId);
    setMessage({ type: "success", text: `KYC ${action}.` });
    loadKycRequests();
    setLoading(false);
  }

  async function handleApproveWithdrawal(requestId: number, userId: string, amount: number) {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from("profiles").select("available_balance").eq("id", userId).single();
      if (profile) {
        await supabase.from("profiles").update({ available_balance: Number(profile.available_balance) - amount }).eq("id", userId);
      }
      await supabase.from("withdrawal_requests").update({ status: "completed" }).eq("id", requestId);
      await supabase.from("transactions").insert({ user_id: userId, type: "withdrawal", amount: amount, status: "completed", reference: `WTH-${requestId}` });

      setMessage({ type: "success", text: "Withdrawal approved and paid." });
      loadWithdrawals();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 mb-6 bg-wb-surface p-1 rounded-xl border border-wb-border overflow-x-auto">
        {(["create", "manage", "kyc", "withdrawals"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-lg transition capitalize ${activeTab === tab ? "bg-wb-primary text-black" : "text-wb-muted hover:text-white"}`}>
            {tab === "kyc" ? "KYC" : tab === "withdrawals" ? "Payouts" : tab}
          </button>
        ))}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-wb-primary/10 border-wb-primary/30 text-wb-primary" : "bg-wb-danger/10 border-wb-danger/30 text-wb-danger"}`}>
          {message.text}
        </div>
      )}

      {/* CREATE MATCH TAB */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateMatch} className="space-y-6 rounded-2xl border border-wb-border bg-wb-surface p-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">League</label><input required type="text" value={league} onChange={(e) => setLeague(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Start Time</label><input required type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Home Team</label><input required type="text" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Away Team</label><input required type="text" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Home (1)</label><input required type="number" step="0.01" value={homeOdds} onChange={(e) => setHomeOdds(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Draw (X)</label><input required type="number" step="0.01" value={drawOdds} onChange={(e) => setDrawOdds(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Away (2)</label><input required type="number" step="0.01" value={awayOdds} onChange={(e) => setAwayOdds(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
          </div>

          <div className="border-t border-wb-border pt-4">
            <div>
              <label className="block text-xs font-semibold text-wb-primary uppercase mb-1">Final Result (For Settlement)</label>
              <input type="text" value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. 2-1 (Leave blank if not finished)" className="w-full rounded-xl border border-wb-primary/50 bg-wb-sub px-4 py-2.5 text-sm text-white" />
              <p className="text-[10px] text-wb-muted mt-1">Used by the system to automatically settle bets.</p>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-40 mt-4">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Create Match
          </button>
        </form>
      )}

      {/* ... (Keep the Manage, KYC, and Withdrawals tabs from the previous code) ... */}
      {/* (They are exactly the same as the previous block, just paste them below) */}
    </div>
  );
}