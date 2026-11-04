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

  // ... (Keep your match creation states here) ...
  const [league, setLeague] = useState(""); const [homeTeam, setHomeTeam] = useState(""); const [awayTeam, setAwayTeam] = useState(""); const [startTime, setStartTime] = useState("");
  const [homeOdds, setHomeOdds] = useState("2.00"); const [drawOdds, setDrawOdds] = useState("3.00"); const [awayOdds, setAwayOdds] = useState("3.50");

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
    try {
      // ... (Your existing create match logic) ...
      const res = await fetch("/api/admin/create-match", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league, homeTeam, awayTeam, startTime, homeOdds: Number(homeOdds), drawOdds: Number(drawOdds), awayOdds: Number(awayOdds) }),
      });
      if (res.ok) setMessage({ type: "success", text: "Match created!" });
    } catch (err: any) { setMessage({ type: "error", text: err.message }); } finally { setLoading(false); }
  }

  async function handleSettle(betId: number, outcome: "won" | "lost") {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settle-bet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ betId, outcome }) });
      if (res.ok) { setMessage({ type: "success", text: `Bet settled.` }); loadPendingBets(); }
    } catch (err: any) { setMessage({ type: "error", text: err.message }); } finally { setLoading(false); }
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
      // 1. Deduct from user balance
      const { data: profile } = await supabase.from("profiles").select("available_balance").eq("id", userId).single();
      if (profile) {
        await supabase.from("profiles").update({ available_balance: Number(profile.available_balance) - amount }).eq("id", userId);
      }
      
      // 2. Mark request as completed
      await supabase.from("withdrawal_requests").update({ status: "completed" }).eq("id", requestId);
      
      // 3. Log transaction
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

      {/* ... (Keep your Create and Manage tabs here) ... */}

      {activeTab === "withdrawals" && (
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <p className="text-center py-10 text-wb-muted">No pending withdrawals.</p>
          ) : (
            withdrawals.map((w) => (
              <div key={w.id} className="rounded-xl border border-wb-border bg-wb-surface p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-wb-primary" />
                    <span className="text-sm font-bold text-white">Withdrawal #{w.id}</span>
                  </div>
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
            ))
          )}
        </div>
      )}

      {/* ... (Keep your KYC and other tabs here) ... */}
    </div>
  );
}