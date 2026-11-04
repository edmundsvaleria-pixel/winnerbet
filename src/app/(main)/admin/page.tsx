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
        body: JSON.stringify({ league, homeTeam, awayTeam, startTime, homeOdds: Number(homeOdds), drawOdds: Number(drawOdds), awayOdds: Number(awayOdds) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Match created successfully!" });
        setLeague(""); setHomeTeam(""); setAwayTeam(""); setStartTime("");
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
      // Deduct from user balance and mark as completed
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
        <form onSubmit={handleCreateMatch} className="space-y-4 rounded-2xl border border-wb-border bg-wb-surface p-6">
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
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-40 mt-4">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Create Match
          </button>
        </form>
      )}

      {/* MANAGE BETS TAB */}
      {activeTab === "manage" && (
        <div className="space-y-3">
          {pendingBets.length === 0 ? <p className="text-center py-10 text-wb-muted">No pending bets.</p> : pendingBets.map((bet) => (
            <div key={bet.id} className="rounded-xl border border-wb-border bg-wb-surface p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-wb-primary mb-1">{bet.booking_code}</p>
                <p className="text-sm text-white font-medium">Stake: {symbol} {Number(bet.stake).toFixed(2)}</p>
                <p className="text-xs text-wb-muted">Potential Win: {symbol} {Number(bet.potential_win).toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleSettle(bet.id, "won")} disabled={loading} className="flex items-center gap-1 rounded-lg bg-wb-primary/10 px-3 py-2 text-xs font-bold text-wb-primary hover:bg-wb-primary/20"><CheckCircle className="h-4 w-4" /> Won</button>
                <button onClick={() => handleSettle(bet.id, "lost")} disabled={loading} className="flex items-center gap-1 rounded-lg bg-wb-danger/10 px-3 py-2 text-xs font-bold text-wb-danger hover:bg-wb-danger/20"><XCircle className="h-4 w-4" /> Lost</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KYC TAB */}
      {activeTab === "kyc" && (
        <div className="space-y-4">
          {kycList.length === 0 ? <p className="text-center py-10 text-wb-muted">No pending KYC requests.</p> : kycList.map((kyc) => (
            <div key={kyc.id} className="rounded-xl border border-wb-border bg-wb-surface p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-wb-muted" /><span className="text-sm text-white font-medium capitalize">{kyc.document_type.replace('_', ' ')}</span></div>
                <div className="flex gap-2">
                  <button onClick={() => handleKycAction(kyc.user_id, kyc.id, "approved")} className="rounded bg-wb-primary/10 px-3 py-1 text-xs font-bold text-wb-primary hover:bg-wb-primary/20">Approve</button>
                  <button onClick={() => handleKycAction(kyc.user_id, kyc.id, "rejected")} className="rounded bg-wb-danger/10 px-3 py-1 text-xs font-bold text-wb-danger hover:bg-wb-danger/20">Reject</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-bold text-wb-muted mb-2 uppercase">Front</p><div className="rounded-lg border border-wb-border overflow-hidden bg-wb-bg"><img src={kyc.document_url} alt="Front" className="w-full h-40 object-contain" /></div></div>
                {kyc.document_url_back && <div><p className="text-xs font-bold text-wb-muted mb-2 uppercase">Back</p><div className="rounded-lg border border-wb-border overflow-hidden bg-wb-bg"><img src={kyc.document_url_back} alt="Back" className="w-full h-40 object-contain" /></div></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAYOUTS TAB */}
      {activeTab === "withdrawals" && (
        <div className="space-y-3">
          {withdrawals.length === 0 ? <p className="text-center py-10 text-wb-muted">No pending withdrawals.</p> : withdrawals.map((w) => (
            <div key={w.id} className="rounded-xl border border-wb-border bg-wb-surface p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Banknote className="h-5 w-5 text-wb-primary" /><span className="text-sm font-bold text-white">Withdrawal #{w.id}</span></div>
                <span className="text-xs font-bold text-wb-primary bg-wb-primary/10 px-2 py-1 rounded-full">Commission Paid</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-wb-muted text-xs">Amount</p><p className="font-bold text-white">{symbol} {Number(w.amount).toFixed(2)}</p></div>
                <div><p className="text-wb-muted text-xs">Commission</p><p className="font-bold text-wb-primary">{symbol} {Number(w.commission_amount).toFixed(2)}</p></div>
                <div><p className="text-wb-muted text-xs">Network</p><p className="font-bold text-white">{w.network}</p></div>
                <div><p className="text-wb-muted text-xs">Number</p><p className="font-bold text-white">{w.momo_number}</p></div>
              </div>
              <button onClick={() => handleApproveWithdrawal(w.id, w.user_id, Number(w.amount))} disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-wb-primary py-2 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-50 mt-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & Pay"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}