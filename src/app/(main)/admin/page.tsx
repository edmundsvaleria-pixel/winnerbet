"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { Loader2, PlusCircle, CheckCircle, XCircle, FileText } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const symbol = useUserStore((s) => s.symbol);
  
  const [activeTab, setActiveTab] = useState<"create" | "manage" | "kyc">("create");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Core Match Details
  const [league, setLeague] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [startTime, setStartTime] = useState("");

  // Odds States
  const [homeOdds, setHomeOdds] = useState("2.00");
  const [drawOdds, setDrawOdds] = useState("3.00");
  const [awayOdds, setAwayOdds] = useState("3.50");
  
  // Optional Markets
  const [dc1x, setDc1x] = useState("");
  const [dc12, setDc12] = useState("");
  const [dcx2, setDcx2] = useState("");
  const [dnbHome, setDnbHome] = useState("");
  const [dnbAway, setDnbAway] = useState("");
  const [bttsYes, setBttsYes] = useState("");
  const [bttsNo, setBttsNo] = useState("");
  const [ou15Over, setOu15Over] = useState("");
  const [ou15Under, setOu15Under] = useState("");
  const [ou25Over, setOu25Over] = useState("");
  const [ou25Under, setOu25Under] = useState("");
  const [ou35Over, setOu35Over] = useState("");
  const [ou35Under, setOu35Under] = useState("");
  const [cs10, setCs10] = useState("");
  const [cs20, setCs20] = useState("");
  const [cs21, setCs21] = useState("");
  const [cs11, setCs11] = useState("");
  const [cs00, setCs00] = useState("");
  const [cs01, setCs01] = useState("");
  const [htftHomeHome, setHtftHomeHome] = useState("");
  const [htftDrawHome, setHtftDrawHome] = useState("");
  const [htftHomeDraw, setHtftHomeDraw] = useState("");
  const [htftDrawDraw, setHtftDrawDraw] = useState("");
  const [htftAwayDraw, setHtftAwayDraw] = useState("");
  const [htftDrawAway, setHtftDrawAway] = useState("");
  const [htftAwayAway, setHtftAwayAway] = useState("");
  const [ahHome, setAhHome] = useState("");
  const [ahAway, setAhAway] = useState("");
  const [fhHome, setFhHome] = useState("");
  const [fhDraw, setFhDraw] = useState("");
  const [fhAway, setFhAway] = useState("");
  const [tg01, setTg01] = useState("");
  const [tg23, setTg23] = useState("");
  const [tg4, setTg4] = useState("");
  const [wtnHome, setWtnHome] = useState("");
  const [wtnAway, setWtnAway] = useState("");
  const [oeOdd, setOeOdd] = useState("");
  const [oeEven, setOeEven] = useState("");
  const [htcs00, setHtcs00] = useState("");
  const [htcs10, setHtcs10] = useState("");
  const [htcs01, setHtcs01] = useState("");
  const [htcs11, setHtcs11] = useState("");

  const [pendingBets, setPendingBets] = useState<any[]>([]);
  const [kycList, setKycList] = useState<any[]>([]);

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

  useEffect(() => {
    if (activeTab === "manage") loadPendingBets();
    if (activeTab === "kyc") loadKycRequests();
  }, [activeTab]);

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/create-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          league, homeTeam, awayTeam, startTime, 
          homeOdds, drawOdds, awayOdds,
          dc1x, dc12, dcx2, dnbHome, dnbAway, bttsYes, bttsNo,
          ou15Over, ou15Under, ou25Over, ou25Under, ou35Over, ou35Under,
          cs10, cs20, cs21, cs11, cs00, cs01,
          htftHomeHome, htftDrawHome, htftHomeDraw, htftDrawDraw, htftAwayDraw, htftDrawAway, htftAwayAway,
          ahHome, ahAway, fhHome, fhDraw, fhAway, tg01, tg23, tg4, wtnHome, wtnAway, oeOdd, oeEven,
          htcs00, htcs10, htcs01, htcs11
        }),
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId, outcome }),
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

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 mb-6 bg-wb-surface p-1 rounded-xl border border-wb-border overflow-x-auto">
        {(["create", "manage", "kyc"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-lg transition capitalize ${activeTab === tab ? "bg-wb-primary text-black" : "text-wb-muted hover:text-white"}`}>
            {tab === "kyc" ? "KYC Requests" : tab}
          </button>
        ))}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-wb-primary/10 border-wb-primary/30 text-wb-primary" : "bg-wb-danger/10 border-wb-danger/30 text-wb-danger"}`}>
          {message.text}
        </div>
      )}

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

          <div className="border-t border-wb-border pt-4">
            <h3 className="text-sm font-bold text-white mb-3">Match Result (1X2)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Home (1)</label><input required type="number" step="0.01" value={homeOdds} onChange={(e) => setHomeOdds(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Draw (X)</label><input required type="number" step="0.01" value={drawOdds} onChange={(e) => setDrawOdds(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
              <div><label className="block text-xs font-semibold text-wb-muted uppercase mb-1">Away (2)</label><input required type="number" step="0.01" value={awayOdds} onChange={(e) => setAwayOdds(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-2.5 text-sm text-white" /></div>
            </div>
          </div>

          <div className="border-t border-wb-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Optional Markets */}
            <div><h3 className="text-sm font-bold text-white mb-2">Double Chance</h3><div className="grid grid-cols-3 gap-2"><input type="number" step="0.01" placeholder="1X" value={dc1x} onChange={(e) => setDc1x(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="12" value={dc12} onChange={(e) => setDc12(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="X2" value={dcx2} onChange={(e) => setDcx2(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Draw No Bet</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="Home" value={dnbHome} onChange={(e) => setDnbHome(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Away" value={dnbAway} onChange={(e) => setDnbAway(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Both Teams To Score</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="Yes" value={bttsYes} onChange={(e) => setBttsYes(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="No" value={bttsNo} onChange={(e) => setBttsNo(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Over/Under 1.5</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="Over" value={ou15Over} onChange={(e) => setOu15Over(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Under" value={ou15Under} onChange={(e) => setOu15Under(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Over/Under 2.5</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="Over" value={ou25Over} onChange={(e) => setOu25Over(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Under" value={ou25Under} onChange={(e) => setOu25Under(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Over/Under 3.5</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="Over" value={ou35Over} onChange={(e) => setOu35Over(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Under" value={ou35Under} onChange={(e) => setOu35Under(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Correct Score</h3><div className="grid grid-cols-3 gap-2"><input type="number" step="0.01" placeholder="1-0" value={cs10} onChange={(e) => setCs10(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="2-0" value={cs20} onChange={(e) => setCs20(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="2-1" value={cs21} onChange={(e) => setCs21(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="1-1" value={cs11} onChange={(e) => setCs11(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="0-0" value={cs00} onChange={(e) => setCs00(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="0-1" value={cs01} onChange={(e) => setCs01(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">HT/FT</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="Home/Home" value={htftHomeHome} onChange={(e) => setHtftHomeHome(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Draw/Home" value={htftDrawHome} onChange={(e) => setHtftDrawHome(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Home/Draw" value={htftHomeDraw} onChange={(e) => setHtftHomeDraw(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Draw/Draw" value={htftDrawDraw} onChange={(e) => setHtftDrawDraw(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Away/Draw" value={htftAwayDraw} onChange={(e) => setHtftAwayDraw(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Draw/Away" value={htftDrawAway} onChange={(e) => setHtftDrawAway(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Away/Away" value={htftAwayAway} onChange={(e) => setHtftAwayAway(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Asian Handicap (-1 / +1)</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="Home -1" value={ahHome} onChange={(e) => setAhHome(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Away +1" value={ahAway} onChange={(e) => setAhAway(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">First Half Winner</h3><div className="grid grid-cols-3 gap-2"><input type="number" step="0.01" placeholder="Home" value={fhHome} onChange={(e) => setFhHome(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Draw" value={fhDraw} onChange={(e) => setFhDraw(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Away" value={fhAway} onChange={(e) => setFhAway(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Total Goals</h3><div className="grid grid-cols-3 gap-2"><input type="number" step="0.01" placeholder="0-1" value={tg01} onChange={(e) => setTg01(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="2-3" value={tg23} onChange={(e) => setTg23(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="4+" value={tg4} onChange={(e) => setTg4(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Win to Nil</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="Home" value={wtnHome} onChange={(e) => setWtnHome(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Away" value={wtnAway} onChange={(e) => setWtnAway(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Odd/Even Goals</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="Odd" value={oeOdd} onChange={(e) => setOeOdd(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="Even" value={oeEven} onChange={(e) => setOeEven(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
            <div><h3 className="text-sm font-bold text-white mb-2">Half Time Correct Score</h3><div className="grid grid-cols-2 gap-2"><input type="number" step="0.01" placeholder="0-0" value={htcs00} onChange={(e) => setHtcs00(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="1-0" value={htcs10} onChange={(e) => setHtcs10(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="0-1" value={htcs01} onChange={(e) => setHtcs01(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /><input type="number" step="0.01" placeholder="1-1" value={htcs11} onChange={(e) => setHtcs11(e.target.value)} className="w-full rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-xs text-white" /></div></div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-40 mt-4">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Create Match with Markets
          </button>
        </form>
      )}

      {activeTab === "manage" && (
        <div className="space-y-3">
          {pendingBets.map((bet) => (
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
          {pendingBets.length === 0 && <p className="text-center py-10 text-wb-muted">No pending bets.</p>}
        </div>
      )}

      {activeTab === "kyc" && (
        <div className="space-y-4">
          {kycList.map((kyc) => (
            <div key={kyc.id} className="rounded-xl border border-wb-border bg-wb-surface p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-wb-muted" />
                  <span className="text-sm text-white font-medium capitalize">{kyc.document_type.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleKycAction(kyc.user_id, kyc.id, "approved")} className="rounded bg-wb-primary/10 px-4 py-2 text-xs font-bold text-wb-primary hover:bg-wb-primary/20">Approve</button>
                  <button onClick={() => handleKycAction(kyc.user_id, kyc.id, "rejected")} className="rounded bg-wb-danger/10 px-4 py-2 text-xs font-bold text-wb-danger hover:bg-wb-danger/20">Reject</button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-wb-muted mb-2 uppercase">Front</p>
                  <div className="rounded-lg border border-wb-border overflow-hidden bg-wb-bg">
                    <img src={kyc.document_url} alt="Front Document" className="w-full h-40 object-contain" />
                  </div>
                </div>
                {kyc.document_url_back && (
                  <div>
                    <p className="text-xs font-bold text-wb-muted mb-2 uppercase">Back</p>
                    <div className="rounded-lg border border-wb-border overflow-hidden bg-wb-bg">
                      <img src={kyc.document_url_back} alt="Back Document" className="w-full h-40 object-contain" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {kycList.length === 0 && <p className="text-center py-10 text-wb-muted">No pending KYC requests.</p>}
        </div>
      )}
    </div>
  );
}