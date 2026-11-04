"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import { 
  Loader2, PlusCircle, CheckCircle, XCircle, FileText, 
  Banknote, BarChart3, TrendingUp, AlertTriangle, DollarSign, Trash2, RotateCcw, Mail
} from "lucide-react";

const CS_OUTCOMES = [
  "1-0", "2-0", "2-1", "3-0", "3-1", "3-2", "4-0", "4-1", "4-2", "5-0", "5-1",
  "0-0", "1-1", "2-2", "3-3", 
  "0-1", "0-2", "1-2", "0-3", "1-3", "2-3", "0-4", "1-4", "2-4", "0-5", "1-5"
];

const HTFT_OUTCOMES = [
  "1/1", "1/X", "1/2",
  "X/1", "X/X", "X/2",
  "2/1", "2/X", "2/2"
];

export default function AdminPage() {
  const router = useRouter();
  const symbol = useUserStore((s) => s.symbol);
  
  const [activeTab, setActiveTab] = useState<"create" | "manage" | "kyc" | "withdrawals" | "analytics">("create");
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
  
  const [over15, setOver15] = useState("");
  const [under15, setUnder15] = useState("");
  const [over25, setOver25] = useState("");
  const [under25, setUnder25] = useState("");
  const [over35, setOver35] = useState("");
  const [under35, setUnder35] = useState("");
  
  const [customOU, setCustomOU] = useState<{ line: string; over: string; under: string }[]>([]);
  const [csOdds, setCsOdds] = useState<Record<string, string>>({});
  const [htftOdds, setHtftOdds] = useState<Record<string, string>>({});
  
  const [result, setResult] = useState("");
  const [htHome, setHtHome] = useState("");
  const [htAway, setHtAway] = useState("");
  const [ftHome, setFtHome] = useState("");
  const [ftAway, setFtAway] = useState("");

  // --- FETCHED DATA STATE ---
  const [pendingBets, setPendingBets] = useState<any[]>([]);
  const [kycList, setKycList] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({ totalStakes: 0, totalWins: 0, ggr: 0, pendingLiability: 0 });

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

  const loadAnalytics = async () => {
    const { data: allBets } = await supabase.from("bets").select("stake, potential_win, status");
    if (allBets) {
      let totalStakes = 0; let totalWins = 0; let pendingLiability = 0;
      allBets.forEach(bet => {
        if (bet.status === "pending") pendingLiability += Number(bet.potential_win);
        else {
          totalStakes += Number(bet.stake);
          if (bet.status === "won") totalWins += Number(bet.potential_win);
        }
      });
      setAnalytics({ totalStakes, totalWins, ggr: totalStakes - totalWins, pendingLiability });
    }
  };

  useEffect(() => {
    if (activeTab === "manage") loadPendingBets();
    if (activeTab === "kyc") loadKycRequests();
    if (activeTab === "withdrawals") loadWithdrawals();
    if (activeTab === "analytics") loadAnalytics();
  }, [activeTab]);

  function addCustomOU() { setCustomOU([...customOU, { line: "", over: "", under: "" }]); }
  function updateCustomOU(index: number, field: "line" | "over" | "under", value: string) {
    const updated = [...customOU]; updated[index][field] = value; setCustomOU(updated);
  }
  function removeCustomOU(index: number) { setCustomOU(customOU.filter((_, i) => i !== index)); }
  function clearCorrectScore() { setCsOdds({}); }
  function clearHtFt() { setHtftOdds({}); }

  function updateCsOdds(outcome: string, value: string) {
    setCsOdds(prev => ({ ...prev, [outcome]: value }));
  }
  function updateHtftOdds(outcome: string, value: string) {
    setHtftOdds(prev => ({ ...prev, [outcome]: value }));
  }

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const finalCsOdds = Object.fromEntries(Object.entries(csOdds).filter(([_, v]) => v !== ""));
      const finalHtftOdds = Object.fromEntries(Object.entries(htftOdds).filter(([_, v]) => v !== ""));

      const formattedCustomOU = customOU
        .filter(item => item.line && item.over && item.under)
        .map(item => ({ line: item.line, over: Number(item.over), under: Number(item.under) }));

      const res = await fetch("/api/admin/create-match", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          league, homeTeam, awayTeam, startTime, 
          homeOdds, drawOdds, awayOdds,
          over15, under15, over25, under25, over35, under35,
          customOU: formattedCustomOU,
          correctScore: finalCsOdds, 
          htFt: finalHtftOdds,
          result,
          htHome, htAway, ftHome, ftAway
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Match created successfully!" });
        setLeague(""); setHomeTeam(""); setAwayTeam(""); setStartTime(""); 
        setHomeOdds("2.00"); setDrawOdds("3.00"); setAwayOdds("3.50");
        setOver15(""); setUnder15(""); setOver25(""); setUnder25(""); setOver35(""); setUnder35("");
        setCustomOU([]); setCsOdds({}); setHtftOdds({}); 
        setResult(""); setHtHome(""); setHtAway(""); setFtHome(""); setFtAway("");
      } else throw new Error(data.error);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSettle(betId: number, outcome: "won" | "lost") {
    setLoading(true); setMessage(null);
    try {
      const res = await fetch("/api/admin/settle-bet", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ betId, outcome }),
      });
      if (res.ok) { setMessage({ type: "success", text: `Bet marked as ${outcome}.` }); loadPendingBets(); }
    } catch (err: any) { setMessage({ type: "error", text: err.message }); } finally { setLoading(false); }
  }

  async function handleVoidMatch(matchId: string) {
    if (!confirm("Are you sure you want to void this match? All pending bets will be refunded.")) return;
    setLoading(true); setMessage(null);
    try {
      const res = await fetch("/api/admin/void-match", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId }),
      });
      if (res.ok) { 
        setMessage({ type: "success", text: "Match voided and bets refunded." }); 
        loadPendingBets(); 
      }
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
      const { data: profile } = await supabase.from("profiles").select("available_balance").eq("id", userId).single();
      if (profile) await supabase.from("profiles").update({ available_balance: Number(profile.available_balance) - amount }).eq("id", userId);
      await supabase.from("withdrawal_requests").update({ status: "completed" }).eq("id", requestId);
      await supabase.from("transactions").insert({ user_id: userId, type: "withdrawal", amount: amount, status: "completed", reference: `WTH-${requestId}` });
      setMessage({ type: "success", text: "Withdrawal approved and paid." });
      loadWithdrawals();
    } catch (err: any) { setMessage({ type: "error", text: err.message }); } finally { setLoading(false); }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-32">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

      {/* TABS INCLUDING EMAIL BUTTON */}
      <div className="flex gap-2 mb-6 bg-wb-surface p-1 rounded-xl border border-wb-border overflow-x-auto">
        {(["create", "manage", "kyc", "withdrawals", "analytics"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-lg transition capitalize ${activeTab === tab ? "bg-wb-primary text-black" : "text-wb-muted hover:text-white"}`}>
            {tab === "kyc" ? "KYC" : tab === "withdrawals" ? "Payouts" : tab === "analytics" ? "Analytics" : tab}
          </button>
        ))}
        
        {/* Email Button Link */}
        <Link href="/admin/send-email" className="flex-1 min-w-[100px] py-2 text-sm font-bold rounded-lg transition capitalize text-wb-primary border border-wb-primary/50 hover:bg-wb-primary/10 flex items-center justify-center gap-1.5">
          <Mail className="h-4 w-4" /> Email
        </Link>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-wb-primary/10 border-wb-primary/30 text-wb-primary" : "bg-wb-danger/10 border-wb-danger/30 text-wb-danger"}`}>
          {message.text}
        </div>
      )}

      {activeTab === "create" && (
        <form onSubmit={handleCreateMatch} className="relative space-y-6 rounded-2xl border border-wb-border bg-wb-surface p-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">League</label><input required type="text" value={league} onChange={(e) => setLeague(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Start Time</label><input required type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Home Team</label><input required type="text" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Away Team</label><input required type="text" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
          </div>
          
          <div className="border-t border-wb-border pt-4">
            <h3 className="text-sm font-bold text-white mb-3">1X2 Odds</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Home (1)</label><input required type="number" step="0.01" value={homeOdds} onChange={(e) => setHomeOdds(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Draw (X)</label><input required type="number" step="0.01" value={drawOdds} onChange={(e) => setDrawOdds(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Away (2)</label><input required type="number" step="0.01" value={awayOdds} onChange={(e) => setAwayOdds(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            </div>
          </div>

          <div className="border-t border-wb-border pt-4">
            <h3 className="text-sm font-bold text-white mb-3">Standard Over/Under</h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Over 1.5</label><input type="number" step="0.01" value={over15} onChange={(e) => setOver15(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Under 1.5</label><input type="number" step="0.01" value={under15} onChange={(e) => setUnder15(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Over 2.5</label><input type="number" step="0.01" value={over25} onChange={(e) => setOver25(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Under 2.5</label><input type="number" step="0.01" value={under25} onChange={(e) => setUnder25(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Over 3.5</label><input type="number" step="0.01" value={over35} onChange={(e) => setOver35(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Under 3.5</label><input type="number" step="0.01" value={under35} onChange={(e) => setUnder35(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            </div>
          </div>

          <div className="border-t border-wb-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Custom Over/Under</h3>
              <button type="button" onClick={addCustomOU} className="flex items-center gap-1 rounded-lg bg-wb-primary/10 px-3 py-1.5 text-xs font-bold text-wb-primary hover:bg-wb-primary/20 transition">
                <PlusCircle className="h-3.5 w-3.5" /> Add Custom Market
              </button>
            </div>
            {customOU.map((market, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end">
                <div><label className="block text-[10px] font-semibold text-wb-muted uppercase mb-1">Line</label><input type="number" step="0.25" placeholder="e.g. 4.5" value={market.line} onChange={(e) => updateCustomOU(index, "line", e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-sm text-white" /></div>
                <div><label className="block text-[10px] font-semibold text-wb-muted uppercase mb-1">Over</label><input type="number" step="0.01" placeholder="1.80" value={market.over} onChange={(e) => updateCustomOU(index, "over", e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-sm text-white" /></div>
                <div><label className="block text-[10px] font-semibold text-wb-muted uppercase mb-1">Under</label><input type="number" step="0.01" placeholder="2.00" value={market.under} onChange={(e) => updateCustomOU(index, "under", e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-sm text-white" /></div>
                <button type="button" onClick={() => removeCustomOU(index)} className="rounded-lg bg-wb-danger/10 p-2 text-wb-danger hover:bg-wb-danger/20 transition mb-0.5"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>

          <div className="border-t border-wb-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Correct Score Odds</h3>
              <button type="button" onClick={clearCorrectScore} className="flex items-center gap-1 rounded-lg bg-wb-surface border border-wb-border-strong px-3 py-1.5 text-xs font-bold text-wb-muted hover:text-white transition">
                <RotateCcw className="h-3.5 w-3.5" /> Clear All
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {CS_OUTCOMES.map((outcome) => (
                <div key={outcome} className="flex flex-col">
                  <label className="block text-[10px] font-semibold text-wb-muted uppercase mb-1">{outcome}</label>
                  <input type="number" step="0.01" placeholder="-" value={csOdds[outcome] || ""} onChange={(e) => updateCsOdds(outcome, e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-2 py-2 text-sm text-white text-center" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-wb-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">HT/FT Odds</h3>
              <button type="button" onClick={clearHtFt} className="flex items-center gap-1 rounded-lg bg-wb-surface border border-wb-border-strong px-3 py-1.5 text-xs font-bold text-wb-muted hover:text-white transition">
                <RotateCcw className="h-3.5 w-3.5" /> Clear All
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
              {HTFT_OUTCOMES.map((outcome) => (
                <div key={outcome} className="flex flex-col">
                  <label className="block text-xs font-semibold text-wb-muted uppercase mb-1">{outcome}</label>
                  <input type="number" step="0.01" placeholder="-" value={htftOdds[outcome] || ""} onChange={(e) => updateHtftOdds(outcome, e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-sm text-white text-center" />
                </div>
              ))}
            </div>
          </div>

          {/* STICKY FOOTER */}
          <div className="sticky bottom-0 -mx-6 -mb-6 bg-wb-surface p-6 border-t border-wb-border-strong shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-wb-primary uppercase mb-1">Final Result (For Settlement)</label>
                <input type="text" value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. 2-1" className="w-full rounded-xl border border-wb-primary/50 bg-wb-sub px-4 py-3 text-sm text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-wb-muted uppercase mb-1">HT Home Score</label>
                <input type="number" value={htHome} onChange={(e) => setHtHome(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-wb-muted uppercase mb-1">HT Away Score</label>
                <input type="number" value={htAway} onChange={(e) => setHtAway(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-wb-muted uppercase mb-1">FT Home Score</label>
                <input type="number" value={ftHome} onChange={(e) => setFtHome(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-wb-muted uppercase mb-1">FT Away Score</label>
                <input type="number" value={ftAway} onChange={(e) => setFtAway(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2 text-sm text-white" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-4 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-40">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Create Match
            </button>
          </div>
        </form>
      )}

      {/* MANAGE BETS TAB */}
      {activeTab === "manage" && (
        <div className="space-y-3">
          {pendingBets.length === 0 ? <p className="text-center py-10 text-wb-muted">No pending bets.</p> : pendingBets.map((bet) => (
            <div key={bet.id} className="rounded-xl border border-wb-border bg-wb-surface p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-wb-primary mb-1">{bet.booking_code}</p>
                  <p className="text-sm text-white font-medium">Stake: {symbol} {Number(bet.stake).toFixed(2)}</p>
                  <p className="text-xs text-wb-muted">Potential Win: {symbol} {Number(bet.potential_win).toFixed(2)}</p>
                </div>
                <span className="text-xs font-bold text-wb-muted bg-wb-bg px-2 py-1 rounded border border-wb-border">ID: {bet.id}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleSettle(bet.id, "won")} disabled={loading} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-wb-primary/10 px-3 py-2 text-xs font-bold text-wb-primary hover:bg-wb-primary/20"><CheckCircle className="h-4 w-4" /> Won</button>
                <button onClick={() => handleSettle(bet.id, "lost")} disabled={loading} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-wb-danger/10 px-3 py-2 text-xs font-bold text-wb-danger hover:bg-wb-danger/20"><XCircle className="h-4 w-4" /> Lost</button>
                <button onClick={() => handleVoidMatch(bet.selections[0]?.matchId)} disabled={loading} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs font-bold text-yellow-500 hover:bg-yellow-500/20"><Trash2 className="h-4 w-4" /> Void Match</button>
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

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-wb-border bg-wb-surface p-5">
              <div className="flex items-center gap-2 text-wb-muted mb-2"><BarChart3 className="h-4 w-4" /> <span className="text-xs font-bold uppercase">Total Stakes</span></div>
              <p className="text-2xl font-bold text-white">{symbol} {analytics.totalStakes.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-wb-border bg-wb-surface p-5">
              <div className="flex items-center gap-2 text-wb-danger mb-2"><TrendingUp className="h-4 w-4" /> <span className="text-xs font-bold uppercase">Total Winnings Paid</span></div>
              <p className="text-2xl font-bold text-white">{symbol} {analytics.totalWins.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-wb-primary/30 bg-wb-primary/5 p-5">
              <div className="flex items-center gap-2 text-wb-primary mb-2"><DollarSign className="h-4 w-4" /> <span className="text-xs font-bold uppercase">Gross Gaming Revenue</span></div>
              <p className="text-2xl font-bold text-wb-primary">{symbol} {analytics.ggr.toFixed(2)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-yellow-500">Pending Liability</h3>
              <p className="text-xs text-wb-muted mt-1">If all currently pending bets win, you will pay out:</p>
              <p className="text-xl font-bold text-white mt-2">{symbol} {analytics.pendingLiability.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}